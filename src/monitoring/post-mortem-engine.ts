import type {
  AgentId,
  MagiDecision,
  OperationalReversalContract,
  PostMortemAnalysis,
  MinorityReport,
} from '../domain/types.js';
import { globalReversalMonitor, type TrippedContractEvent } from './reversal-monitor.js';
import { globalCalibrationEngine } from '../calibration/calibration-engine.js';

export interface PostMortemInput {
  decisionId: string;
  originalDecision: MagiDecision;
  declaredConfidence: number;
  reversalReason: string;
  minorityReport?: MinorityReport;
  trippedContract?: OperationalReversalContract;
}

export class ReversalPostMortemEngine {
  private analyses: Map<string, PostMortemAnalysis> = new Map();

  constructor() {
    this.seedDefaultPostMortems();
    this.attachToReversalMonitor();
  }

  /**
   * Resets stored post-mortems (useful for test isolation)
   */
  public reset(empty = false): void {
    this.analyses.clear();
    if (!empty) {
      this.seedDefaultPostMortems();
    }
  }

  /**
   * Attaches listener to the global reversal monitor to automatically autopsy tripped contracts
   */
  private attachToReversalMonitor(): void {
    globalReversalMonitor.onContractTripped((event: TrippedContractEvent) => {
      // Find outcome record if available
      const outcome = globalCalibrationEngine.getOutcomeById(event.decisionId);
      const contractData = globalReversalMonitor.getContractById(event.contractId);

      this.analyzeReversal({
        decisionId: event.decisionId,
        originalDecision: 'CONDITIONAL_PASS', // Default or retrieved
        declaredConfidence: outcome?.declaredConfidence ?? 0.85,
        reversalReason: `Operational Contract Breached: ${event.description} (Observed: ${event.observedValue} ${event.operator} ${event.threshold})`,
        trippedContract: contractData?.contract,
      });
    });
  }

  /**
   * Performs systematic post-mortem autopsy on a reverted decision
   */
  public analyzeReversal(input: PostMortemInput): PostMortemAnalysis {
    const dissentingAgent: AgentId = input.minorityReport?.dissentingAgent || 'BALTHASAR';
    const minorityConcern = input.minorityReport?.minorityConcern || '';
    const reversalReason = input.reversalReason.toLowerCase();

    // 1. Compute Minority Vindication Score
    let minorityVindicationScore = 0.5; // Baseline
    const concernWords = minorityConcern
      .toLowerCase()
      .split(/[\s,.;:!?]+/)
      .filter(w => w.length > 3);

    let matchCount = 0;
    concernWords.forEach(word => {
      if (reversalReason.includes(word)) {
        matchCount++;
      }
    });

    if (input.trippedContract) {
      // If a reversal condition / contract created by or matching minority concern was tripped
      minorityVindicationScore = 0.92;
    } else if (matchCount >= 2 || reversalReason.includes('latency') || reversalReason.includes('pool') || reversalReason.includes('risk') || reversalReason.includes('fail')) {
      minorityVindicationScore = Math.min(1.0, 0.75 + matchCount * 0.08);
    } else {
      minorityVindicationScore = 0.60;
    }

    const minorityVindicated = minorityVindicationScore >= 0.70;

    // 2. Identify majority flaw
    let majorityFlaw: string;
    if (dissentingAgent === 'BALTHASAR') {
      majorityFlaw = 'Melchior and Casper suffered from theoretical optimism and discounted tail-risk operational friction highlighted by Balthasar.';
    } else if (dissentingAgent === 'CASPER') {
      majorityFlaw = 'Melchior and Balthasar polarized on ideological lines and ignored Casper pragmatic compromise alternative.';
    } else {
      majorityFlaw = 'Supercomputer consensus failed to enforce empirical fact-checking, relying on speculative assumptions.';
    }

    // 3. Recommended adjustments
    const recommendedAdjustments: string[] = [
      'Tighten automated canary thresholds and mandatory circuit-breaker trip conditions.',
      `Elevate predictive epistemic weight of dissenting agent [${dissentingAgent}] for similar architectural domains.`,
      'Mandate empirical proof benchmarks prior to approving non-reversible infrastructure pivots.',
    ];

    // 4. Agent reputation deltas
    const reputationDeltas: Record<AgentId, number> = {
      MELCHIOR: -0.10,
      BALTHASAR: -0.10,
      CASPER: -0.10,
    };

    if (minorityVindicated) {
      reputationDeltas[dissentingAgent] = +0.25;
      (Object.keys(reputationDeltas) as AgentId[]).forEach(id => {
        if (id !== dissentingAgent) {
          reputationDeltas[id] = -0.15;
        }
      });
    }

    const analysis: PostMortemAnalysis = {
      decisionId: input.decisionId,
      analysisTimestamp: new Date().toISOString(),
      originalDecision: input.originalDecision,
      declaredConfidence: input.declaredConfidence,
      dissentingAgent,
      trippedContract: input.trippedContract,
      reversalReason: input.reversalReason,
      minorityVindicated,
      minorityVindicationScore: Number(minorityVindicationScore.toFixed(3)),
      rootCauseAttribution: `Operational breach triggered by: ${input.reversalReason}. ${dissentingAgent} explicitly anticipated this failure mode in the recorded Minority Report.`,
      majorityFlaw,
      recommendedAdjustments,
      agentReputationDeltas: reputationDeltas,
    };

    this.analyses.set(input.decisionId, analysis);
    return analysis;
  }

  /**
   * Retrieves all post-mortem reports
   */
  public getAllPostMortems(): PostMortemAnalysis[] {
    return Array.from(this.analyses.values());
  }

  /**
   * Retrieves post-mortem for a specific decision
   */
  public getPostMortemById(decisionId: string): PostMortemAnalysis | undefined {
    return this.analyses.get(decisionId);
  }

  /**
   * Seeds historical post-mortems for pre-seeded reversed decisions
   */
  private seedDefaultPostMortems(): void {
    const historicalAnalysis: PostMortemAnalysis = {
      decisionId: 'HIST-009',
      analysisTimestamp: '2026-08-20T14:00:00Z',
      originalDecision: 'CONDITIONAL_PASS',
      declaredConfidence: 0.92,
      dissentingAgent: 'BALTHASAR',
      reversalReason: 'Database connection pool starvation under unexpected surge',
      minorityVindicated: true,
      minorityVindicationScore: 0.95,
      rootCauseAttribution: 'Connection pool burst exhausted available handles within 12 minutes of traffic surge. Balthasar explicitly warned against this in the minority report.',
      majorityFlaw: 'Melchior and Casper dismissed database saturation risk under peak load.',
      recommendedAdjustments: [
        'Enforce connection pool backpressure sizing formulas before production rollout.',
        'Mandate automated circuit breaker trip if pool utilization exceeds 90%.',
      ],
      agentReputationDeltas: {
        MELCHIOR: -0.15,
        BALTHASAR: 0.25,
        CASPER: -0.15,
      },
    };

    this.analyses.set(historicalAnalysis.decisionId, historicalAnalysis);
  }
}

export const globalPostMortemEngine = new ReversalPostMortemEngine();
