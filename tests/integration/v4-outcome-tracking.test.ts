import { describe, it, expect, beforeEach } from 'vitest';
import { DecisionMemoryStore } from '../../src/memory/decision-memory.js';
import { AgentReputationRegistry } from '../../src/memory/agent-reputation-registry.js';
import { OutcomeTracker } from '../../src/memory/outcome-tracker.js';
import { ReversalPostMortemEngine } from '../../src/monitoring/post-mortem-engine.js';
import { ConfidenceCalibrationEngine } from '../../src/calibration/calibration-engine.js';
import { MagiCore } from '../../src/deliberation/magi-core.js';
import { MockLanguageModelProvider } from '../../src/providers/mock/mock.provider.js';
import type {
  AgentStructuredOutput,
  AuditableDecision,
  DeliberationRound,
} from '../../src/domain/types.js';

describe('V4.2 End-to-End Outcome Tracking & Reputation Feedback Loop', () => {
  let reputationRegistry: AgentReputationRegistry;
  let postMortemEngine: ReversalPostMortemEngine;
  let calibrationEngine: ConfidenceCalibrationEngine;
  let outcomeTracker: OutcomeTracker;
  let memory: DecisionMemoryStore;

  beforeEach(() => {
    reputationRegistry = new AgentReputationRegistry(true); // empty baseline
    postMortemEngine = new ReversalPostMortemEngine();
    postMortemEngine.reset(true);
    calibrationEngine = new ConfidenceCalibrationEngine();
    calibrationEngine.reset(true);

    outcomeTracker = new OutcomeTracker({
      reputationRegistry,
      postMortemEngine,
      calibrationEngine,
    });

    memory = new DecisionMemoryStore({ outcomeTracker }, true);
  });

  it('should complete the empirical learning cycle: decision -> failure -> autopsy -> vindication -> weight elevation', async () => {
    // 1. Initial State: Balthasar has 0.0 modifier in DATABASE
    const initialMod = reputationRegistry.getDomainWeightModifier('BALTHASAR', 'DATABASE');
    expect(initialMod).toBe(0.0);

    // 2. MAGI emits an Auditable Decision
    const auditableDecision: AuditableDecision = {
      verdict: 'CONDITIONAL_PASS',
      confidence: 0.90,
      risks: [
        { id: 'r1', description: 'Database connection pool starvation', severity: 'CATASTROPHIC', mitigation: 'Pooler sizing' },
      ],
      minorityConcern: 'Balthasar warned of connection pool handle starvation under surge',
      reversalConditions: ['Pool utilization >= 95%'],
      evidence: [],
      assumptions: [],
      unknowns: ['Burst concurrency ratio'],
      nextActions: [{ id: 'a1', title: 'Deploy proxy', phase: 'CANARY', mandatoryValidation: 'Pool usage < 80%' }],
      expectedOutcome: 'P99 latency < 250ms, pool utilization < 75%',
    };

    const recorded = memory.recordDecision({
      decision: auditableDecision,
      problem: 'Migrate session tokens from Redis to PostgreSQL',
      domain: 'DATABASE',
      decisionId: 'DEC-E2E-LOOP-1',
      metadata: {
        dissentingAgent: 'BALTHASAR',
        deliberationRoundsCount: 2,
      },
    });

    expect(recorded.status).toBe('PENDING');

    // 3. Telemetry arrives 30 days later: Production suffered connection pool starvation
    const trackingResult = memory.trackDecisionOutcome({
      decisionId: 'DEC-E2E-LOOP-1',
      actualOutcome: 'Connection pool burst exhausted available handles within 12 minutes of traffic surge. 5xx spiked to 8.4%.',
      observedMetrics: { p99_latency_ms: 780 },
      status: 'REVERTED',
      reversalReason: 'Database connection pool starvation under unexpected surge',
      trippedContractId: 'rc-pool-starve',
    });

    expect(trackingResult.status).toBe('REVERTED');
    expect(trackingResult.deltaReport.rawDelta).toBeGreaterThanOrEqual(0.70);
    expect(trackingResult.postMortem?.minorityVindicated).toBe(true);
    expect(trackingResult.postMortem?.dissentingAgent).toBe('BALTHASAR');

    // 4. Verify Balthasar earned reputation and domain authority bonus
    const balthasarProfile = reputationRegistry.getReputation('BALTHASAR');
    expect(balthasarProfile.baseReputation).toBe(7.25);
    expect(balthasarProfile.minorityVindications).toBe(1);
    expect(balthasarProfile.domainReputations.DATABASE.score).toBeGreaterThanOrEqual(7.5);

    // 5. Verify subsequent deliberation in DATABASE applies the earned bonus to Balthasar
    const updatedMod = reputationRegistry.getDomainWeightModifier('BALTHASAR', 'DATABASE');
    expect(updatedMod).toBeGreaterThanOrEqual(0.2);

    // 6. Test deliberation synthesis with reputationRegistry and domain
    const mockProvider = new MockLanguageModelProvider();
    mockProvider.onGenerate(() => ({
      finalDecision: 'CONDITIONAL_PASS',
      coreVerdict: 'Proceed with mandatory connection pooling safeguards.',
      argumentQualityScore: {
        MELCHIOR: 7,
        BALTHASAR: 7,
        CASPER: 7,
      },
      decisiveFactors: ['Pool sizing constraints'],
      synthesisSummary: 'Synthetic consensus incorporating Balthasar warnings.',
      dissentingOpinionsNoted: [],
      deliberationRoundsCount: 1,
    }));

    const magiCore = new MagiCore(mockProvider);
    const initialOutputs: Record<'MELCHIOR' | 'BALTHASAR' | 'CASPER', AgentStructuredOutput> = {
      MELCHIOR: {
        agentId: 'MELCHIOR',
        stance: 'APPROVE',
        confidence: 0.85,
        summary: 'Technically sound schema.',
        keyArguments: ['Direct query performance'],
        criticalAssumptions: [],
        identifiedRisks: [],
        recommendedAction: 'Proceed',
      },
      BALTHASAR: {
        agentId: 'BALTHASAR',
        stance: 'CONDITIONAL',
        confidence: 0.80,
        summary: 'Risk of handle exhaustion.',
        keyArguments: ['High concurrency lock pressure'],
        criticalAssumptions: [],
        identifiedRisks: ['Connection starvation'],
        recommendedAction: 'Mandate pool buffer',
      },
      CASPER: {
        agentId: 'CASPER',
        stance: 'APPROVE',
        confidence: 0.75,
        summary: 'Pragmatic migration path.',
        keyArguments: ['Low operational complexity'],
        criticalAssumptions: [],
        identifiedRisks: [],
        recommendedAction: 'Proceed with monitoring',
      },
    };

    const rounds: DeliberationRound[] = [];

    const synthesis = await magiCore.synthesize(
      'Should we expand Postgres read-replicas for hot tables?',
      initialOutputs,
      rounds,
      {
        domain: 'DATABASE',
        reputationRegistry,
      }
    );

    // Balthasar score was 7, with >= +0.2 domain mod rounded to integer/half it elevates above Melchior
    expect(synthesis.argumentQualityScore.BALTHASAR).toBeGreaterThanOrEqual(synthesis.argumentQualityScore.MELCHIOR);
    expect(synthesis.auditableDecision).toBeDefined();
  });
});
