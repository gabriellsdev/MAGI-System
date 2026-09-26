import type { AgentId, AuditableDecision, MagiDecision } from '../domain/types.js';
import type {
  DecisionOutcomeStatus,
  MemoryQueryFilter,
  MemorySummaryStats,
  OutcomeTrackingInput,
  OutcomeTrackingResult,
  StoredDecision,
} from './memory.types.js';
import { globalOutcomeTracker, OutcomeTracker } from './outcome-tracker.js';
import { JsonFileStore } from '../storage/json-storage.js';

export interface DecisionMemoryOptions {
  outcomeTracker?: OutcomeTracker;
  storageDir?: string;
  persist?: boolean;
}

export class DecisionMemoryStore {
  private decisions: Map<string, StoredDecision> = new Map();
  private outcomeTracker: OutcomeTracker;
  private fileStore: JsonFileStore<StoredDecision[]>;

  constructor(options: DecisionMemoryOptions = {}, empty = false) {
    this.outcomeTracker = options.outcomeTracker ?? globalOutcomeTracker;
    this.fileStore = new JsonFileStore<StoredDecision[]>('decisions.json', [], {
      storageDir: options.storageDir,
      enabled: options.persist,
    });

    if (!empty) {
      const persisted = this.fileStore.load();
      if (persisted && persisted.length > 0) {
        persisted.forEach(d => this.decisions.set(d.decisionId, d));
      } else {
        this.seedDefaultDecisions();
        this.persist();
      }
    }
  }

  private persist(): void {
    if (this.fileStore.isEnabled()) {
      this.fileStore.save(Array.from(this.decisions.values()));
    }
  }

  /**
   * Resets all stored decisions (useful for clean test isolation)
   */
  public reset(empty = false): void {
    this.decisions.clear();
    if (!empty) {
      this.seedDefaultDecisions();
    }
    this.persist();
  }

  /**
   * Records a newly synthesized auditable decision into memory
   */
  public recordDecision(params: {
    decision: AuditableDecision;
    problem: string;
    domain?: string;
    decisionId?: string;
    verdict?: MagiDecision;
    declaredConfidence?: number;
    synthesisSummary?: string;
    metadata?: Record<string, unknown>;
  }): StoredDecision {
    const id = params.decisionId || `DEC-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const domain = (params.domain || 'GENERAL').toUpperCase();
    const verdict = params.verdict || (params.decision.verdict as MagiDecision) || 'CONDITIONAL_PASS';
    const declaredConfidence = params.declaredConfidence ?? params.decision.confidence ?? 0.85;

    const stored: StoredDecision = {
      decisionId: id,
      timestamp: new Date().toISOString(),
      problem: params.problem,
      domain,
      verdict,
      declaredConfidence,
      auditableDecision: params.decision,
      synthesisSummary: params.synthesisSummary || `Synthesized verdict: ${verdict} (Confidence: ${declaredConfidence})`,
      status: 'PENDING',
      metadata: params.metadata,
    };

    this.decisions.set(id, stored);
    this.persist();
    return stored;
  }

  /**
   * Retrieves a decision by ID
   */
  public getDecision(decisionId: string): StoredDecision | undefined {
    return this.decisions.get(decisionId);
  }

  /**
   * Retrieves all decisions
   */
  public getAllDecisions(): StoredDecision[] {
    return Array.from(this.decisions.values());
  }

  /**
   * Alias for queryDecisions to support both conventions
   */
  public getDecisions(filter: MemoryQueryFilter = {}): StoredDecision[] {
    return this.queryDecisions(filter);
  }

  /**
   * Queries decisions matching filter criteria
   */
  public queryDecisions(filter: MemoryQueryFilter = {}): StoredDecision[] {
    return Array.from(this.decisions.values()).filter(d => {
      if (filter.domain && d.domain.toUpperCase() !== filter.domain.toUpperCase()) {
        return false;
      }
      if (filter.status && d.status !== filter.status) {
        return false;
      }
      if (filter.minConfidence !== undefined && d.declaredConfidence < filter.minConfidence) {
        return false;
      }
      if (filter.maxDelta !== undefined && (d.outcomeDelta ?? 0) > filter.maxDelta) {
        return false;
      }
      if (filter.searchQuery) {
        const q = filter.searchQuery.toLowerCase();
        const match = d.problem.toLowerCase().includes(q) ||
          d.decisionId.toLowerCase().includes(q) ||
          d.synthesisSummary.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }

  /**
   * Ingests actual production outcome and computes deviation error
   */
  public trackDecisionOutcome(input: OutcomeTrackingInput): OutcomeTrackingResult {
    const decision = this.decisions.get(input.decisionId);
    if (!decision) {
      throw new Error(`Decision not found in memory: ${input.decisionId}`);
    }

    const result = this.outcomeTracker.trackDecisionOutcome(decision, input);

    // Update stored record in memory
    decision.status = result.status;
    decision.actualOutcome = input.actualOutcome;
    decision.observedMetrics = input.observedMetrics;
    decision.outcomeDelta = result.deltaReport.rawDelta;
    decision.matchClassification = result.deltaReport.matchClassification;
    decision.failurePattern = result.failurePattern;
    decision.reversalReason = input.reversalReason;
    decision.trippedContractId = input.trippedContractId;
    decision.resolvedAt = new Date().toISOString();
    decision.postMortem = result.postMortem;

    this.persist();
    return result;
  }

  /**
   * Computes statistical overview of stored decision memory
   */
  public getMemorySummary(): MemorySummaryStats {
    const list = Array.from(this.decisions.values());
    const totalDecisions = list.length;
    const pendingCount = list.filter(d => d.status === 'PENDING').length;
    const survivedCount = list.filter(d => d.status === 'SURVIVED').length;
    const revertedCount = list.filter(d => d.status === 'REVERTED').length;

    const resolved = list.filter(d => d.status !== 'PENDING');
    const survivalRate = resolved.length > 0
      ? Number((survivedCount / resolved.length).toFixed(3))
      : 0;

    const averageConfidence = totalDecisions > 0
      ? Number((list.reduce((acc, d) => acc + d.declaredConfidence, 0) / totalDecisions).toFixed(3))
      : 0;

    const deltas = resolved.map(d => d.outcomeDelta).filter((d): d is number => d !== undefined);
    const averageDelta = deltas.length > 0
      ? Number((deltas.reduce((a, b) => a + b, 0) / deltas.length).toFixed(3))
      : 0;

    const domainsRepresented = Array.from(new Set(list.map(d => d.domain)));

    return {
      totalDecisions,
      pendingCount,
      survivedCount,
      revertedCount,
      survivalRate,
      averageConfidence,
      averageDelta,
      domainsRepresented,
    };
  }

  /**
   * Seeds historical operational decisions matching enterprise dataset
   */
  private seedDefaultDecisions(): void {
    const historicalSeeds: StoredDecision[] = [
      {
        decisionId: 'HIST-001',
        timestamp: '2026-08-01T10:00:00Z',
        problem: 'Should we migrate the authorization service from REST to gRPC?',
        domain: 'ARCHITECTURE',
        verdict: 'CONSENSUS_REACHED',
        declaredConfidence: 0.94,
        synthesisSummary: 'Approved gRPC migration with binary protobuf schemas for internal RPCs.',
        status: 'SURVIVED',
        actualOutcome: 'Latency reduced by 42% across internal service meshes. Zero SLA violations.',
        outcomeDelta: 0.08,
        matchClassification: 'ACCURATE',
        resolvedAt: '2026-08-15T10:00:00Z',
        auditableDecision: {
          verdict: 'APPROVED',
          confidence: 0.94,
          risks: [{ id: 'r-1', description: 'Schema drift between services', severity: 'MEDIUM', mitigation: 'Protobuf CI validation' }],
          minorityConcern: 'Minor client tooling ergonomics',
          reversalConditions: ['gRPC latency exceeds REST baseline by > 10%'],
          evidence: [],
          assumptions: [],
          unknowns: [],
          nextActions: [{ id: 'a-1', title: 'Deploy gRPC proxy', phase: 'CANARY', mandatoryValidation: 'Error rate < 0.1%' }],
          expectedOutcome: 'P99 latency < 20ms, CPU overhead reduction > 30%',
        },
      },
      {
        decisionId: 'HIST-009',
        timestamp: '2026-08-20T12:00:00Z',
        problem: 'Migrate user session storage from Redis Cluster to PostgreSQL relational tables under high load',
        domain: 'DATABASE',
        verdict: 'CONDITIONAL_PASS',
        declaredConfidence: 0.92,
        synthesisSummary: 'Approved migration assuming connection poolers would absorb concurrent peak surges.',
        status: 'REVERTED',
        actualOutcome: 'Connection pool burst exhausted available handles within 12 minutes of traffic surge. 5xx spiked to 8.4%.',
        outcomeDelta: 0.92,
        matchClassification: 'FAILED',
        failurePattern: 'INVARIANT_BREACH',
        reversalReason: 'Database connection pool starvation under unexpected surge',
        trippedContractId: 'rc-pool-starve',
        resolvedAt: '2026-08-20T13:42:00Z',
        postMortem: {
          decisionId: 'HIST-009',
          analysisTimestamp: '2026-08-20T14:00:00Z',
          originalDecision: 'CONDITIONAL_PASS',
          declaredConfidence: 0.92,
          dissentingAgent: 'BALTHASAR',
          reversalReason: 'Database connection pool starvation under unexpected surge',
          minorityVindicated: true,
          minorityVindicationScore: 0.95,
          rootCauseAttribution: 'Failure to account for connection burst limits during flash loads',
          majorityFlaw: 'Overconfidence in connection pooler auto-scaling',
          recommendedAdjustments: ['Mandate hard queue bounds and fallback cache'],
          agentReputationDeltas: { MELCHIOR: -0.8, BALTHASAR: 1.2, CASPER: -0.4 },
        },
        auditableDecision: {
          verdict: 'CONDITIONAL_PASS',
          confidence: 0.92,
          risks: [{ id: 'r-1', description: 'Connection pool starvation', severity: 'CATASTROPHIC', mitigation: 'Size PgBouncer to 500 connections' }],
          minorityConcern: 'Balthasar warned that concurrent connection spikes would starve Postgres connection pool.',
          reversalConditions: ['Connection pool utilization >= 95% for more than 5m'],
          evidence: [],
          assumptions: [],
          unknowns: ['Peak concurrent connection burst factor'],
          nextActions: [{ id: 'a-1', title: 'PgBouncer canary', phase: 'CANARY', mandatoryValidation: 'Pool utilization < 80%' }],
          expectedOutcome: 'P99 latency < 50ms, pool utilization < 70%',
        },
      },
      {
        decisionId: 'HIST-010',
        timestamp: '2026-08-23T15:30:00Z',
        problem: 'Implement pessimistic row-level locking for inventory reservation during flash sale events',
        domain: 'INFRASTRUCTURE',
        verdict: 'CONDITIONAL_PASS',
        declaredConfidence: 0.88,
        synthesisSummary: 'Pessimistic lock approved for strict consistency guarantees.',
        status: 'REVERTED',
        actualOutcome: 'Lock contention caused P99 latency degradation of 65% reaching 825ms.',
        outcomeDelta: 0.88,
        matchClassification: 'FAILED',
        failurePattern: 'INVARIANT_BREACH',
        reversalReason: 'P99 latency degraded by 65% due to distributed lock contention',
        trippedContractId: 'rc-p99-lock',
        resolvedAt: '2026-08-24T02:11:00Z',
        postMortem: {
          decisionId: 'HIST-010',
          analysisTimestamp: '2026-08-24T03:00:00Z',
          originalDecision: 'CONDITIONAL_PASS',
          declaredConfidence: 0.88,
          dissentingAgent: 'BALTHASAR',
          reversalReason: 'P99 latency degraded by 65% due to distributed lock contention',
          minorityVindicated: true,
          minorityVindicationScore: 0.92,
          rootCauseAttribution: 'Head-of-line blocking in row-level pessimistic locking',
          majorityFlaw: 'Ignoring distributed queue contention under high write volume',
          recommendedAdjustments: ['Adopt optimistic locking or partition inventory'],
          agentReputationDeltas: { MELCHIOR: -0.6, BALTHASAR: 1.0, CASPER: -0.3 },
        },
        auditableDecision: {
          verdict: 'CONDITIONAL_PASS',
          confidence: 0.88,
          risks: [{ id: 'r-1', description: 'Distributed lock deadlock cascades', severity: 'HIGH', mitigation: 'Timeout set to 250ms' }],
          minorityConcern: 'Balthasar warned of lock queue head-of-line blocking under extreme concurrency.',
          reversalConditions: ['P99 response latency exceeds 500ms'],
          evidence: [],
          assumptions: [],
          unknowns: ['Lock wait timeout ceiling'],
          nextActions: [{ id: 'a-1', title: 'Load test locking', phase: 'CANARY', mandatoryValidation: 'Lock queue < 100' }],
          expectedOutcome: 'P99 latency < 350ms, zero overselling incidents',
        },
      },
      {
        decisionId: 'HIST-021',
        timestamp: '2026-09-20T18:00:00Z',
        problem: 'Deploy dynamic edge caching rule for authenticated API responses',
        domain: 'SECURITY',
        verdict: 'CONDITIONAL_PASS',
        declaredConfidence: 0.85,
        synthesisSummary: 'Conditional pass with stringent Vary: Authorization header validation.',
        status: 'PENDING',
        auditableDecision: {
          verdict: 'CONDITIONAL_PASS',
          confidence: 0.85,
          risks: [{ id: 'r-1', description: 'Cross-user data leakage due to misconfigured cache keys', severity: 'CATASTROPHIC', mitigation: 'Strict HMAC cache key signing' }],
          minorityConcern: 'Risk of token leakage in edge proxy memory cache',
          reversalConditions: ['Error rate > 1.5%', 'P99 latency > 250ms'],
          evidence: [],
          assumptions: [],
          unknowns: ['Vary header normalization in CDN PoPs'],
          nextActions: [{ id: 'a-1', title: 'Staging CDN validation', phase: 'CANARY', mandatoryValidation: 'Zero cache cross-contamination' }],
          expectedOutcome: 'Cache hit ratio > 65%, error rate < 0.1%',
        },
      },
    ];

    historicalSeeds.forEach(d => this.decisions.set(d.decisionId, d));
  }
}

export const globalDecisionMemory = new DecisionMemoryStore();
