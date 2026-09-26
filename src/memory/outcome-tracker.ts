import type { AgentId, PostMortemAnalysis } from '../domain/types.js';
import {
  globalPostMortemEngine,
  ReversalPostMortemEngine,
} from '../monitoring/post-mortem-engine.js';
import {
  globalCalibrationEngine,
  ConfidenceCalibrationEngine,
} from '../calibration/calibration-engine.js';
import {
  globalAgentReputationRegistry,
  AgentReputationRegistry,
} from './agent-reputation-registry.js';
import type {
  FailurePattern,
  MatchClassification,
  OutcomeDeltaReport,
  OutcomeTrackingInput,
  OutcomeTrackingResult,
  StoredDecision,
} from './memory.types.js';

export interface OutcomeTrackerOptions {
  postMortemEngine?: ReversalPostMortemEngine;
  calibrationEngine?: ConfidenceCalibrationEngine;
  reputationRegistry?: AgentReputationRegistry;
}

export class OutcomeTracker {
  private postMortemEngine: ReversalPostMortemEngine;
  private calibrationEngine: ConfidenceCalibrationEngine;
  private reputationRegistry: AgentReputationRegistry;

  constructor(options: OutcomeTrackerOptions = {}) {
    this.postMortemEngine = options.postMortemEngine ?? globalPostMortemEngine;
    this.calibrationEngine = options.calibrationEngine ?? globalCalibrationEngine;
    this.reputationRegistry = options.reputationRegistry ?? globalAgentReputationRegistry;
  }

  /**
   * Computes empirical decision error: Delta_outcome = |A_actual - E_expected|
   */
  public computeOutcomeDelta(
    expectedOutcome: string,
    actualOutcome: string,
    observedMetrics?: Record<string, number>,
    isExplicitlyReverted = false
  ): OutcomeDeltaReport {
    const metricDeltas: Record<string, number> = {};
    let metricDeltaSum = 0;
    let metricCount = 0;

    // 1. Metric-based numerical comparison if observed metrics are provided
    if (observedMetrics && Object.keys(observedMetrics).length > 0) {
      Object.entries(observedMetrics).forEach(([metricKey, observedVal]) => {
        const constraint = this.extractTargetConstraint(expectedOutcome, metricKey);
        if (constraint !== null) {
          const { target, operator } = constraint;
          let rawErr = 0;
          if (operator === '<') {
            // Upper bound SLA (e.g. latency < 350ms, error < 0.5%)
            if (observedVal > target) {
              const denom = Math.max(Math.abs(target), 1.0);
              rawErr = (observedVal - target) / denom;
            } else {
              rawErr = 0; // Met within SLA bounds
            }
          } else if (operator === '>') {
            // Lower bound SLA (e.g. throughput > 1000)
            if (observedVal < target) {
              const denom = Math.max(Math.abs(target), 1.0);
              rawErr = (target - observedVal) / denom;
            } else {
              rawErr = 0; // Met within SLA bounds
            }
          } else {
            const denom = Math.max(Math.abs(target), 1.0);
            rawErr = Math.abs(observedVal - target) / denom;
          }

          const normalizedErr = Math.min(1.0, rawErr);
          metricDeltas[metricKey] = Number(normalizedErr.toFixed(3));
          metricDeltaSum += normalizedErr;
          metricCount++;
        }
      });
    }

    // 2. Lexical & semantic deviation analysis
    let textDeviation = 0.15; // default base deviation
    const actualLower = actualOutcome.toLowerCase();
    const expectedLower = expectedOutcome.toLowerCase();

    const failureKeywords = ['breach', 'failure', 'fail', 'starvation', 'crash', 'oom', 'leak', 'rollback', 'halt', 'revert', 'incident', 'cascade'];
    const matchCount = failureKeywords.filter(w => actualLower.includes(w)).length;

    if (isExplicitlyReverted) {
      textDeviation = Math.min(1.0, 0.75 + matchCount * 0.05);
    } else if (matchCount > 0) {
      textDeviation = Math.min(1.0, 0.40 + matchCount * 0.12);
    } else {
      // Check keyword overlap
      const expectedWords = expectedLower.split(/[\s,.;:!?]+/).filter(w => w.length > 3);
      const overlap = expectedWords.filter(w => actualLower.includes(w)).length;
      const ratio = expectedWords.length > 0 ? overlap / expectedWords.length : 0.5;
      textDeviation = Math.max(0.05, 1.0 - ratio * 0.8);
    }

    // Combine metric delta and text deviation
    let finalDelta: number;
    if (metricCount > 0) {
      const avgMetricDelta = metricDeltaSum / metricCount;
      if (avgMetricDelta === 0 && matchCount === 0 && !isExplicitlyReverted) {
        finalDelta = 0.05;
      } else {
        finalDelta = Number((avgMetricDelta * 0.7 + textDeviation * 0.3).toFixed(3));
      }
    } else {
      finalDelta = Number(textDeviation.toFixed(3));
    }

    if (isExplicitlyReverted && finalDelta < 0.70) {
      finalDelta = 0.85;
    }

    finalDelta = Math.max(0.0, Math.min(1.0, finalDelta));

    // Determine match classification
    let matchClassification: MatchClassification;
    if (finalDelta < 0.20) {
      matchClassification = 'ACCURATE';
    } else if (finalDelta < 0.50) {
      matchClassification = 'ACCEPTABLE';
    } else if (finalDelta < 0.80) {
      matchClassification = 'DEVIATED';
    } else {
      matchClassification = 'FAILED';
    }

    const explanation = `Observed outcome deviated by ${(finalDelta * 100).toFixed(1)}% from expectations. Classification: ${matchClassification}.`;

    return {
      rawDelta: finalDelta,
      matchClassification,
      metricDeltas,
      explanation,
    };
  }

  /**
   * Categorizes the systemic failure pattern when a decision deviates or reverts
   */
  public classifyFailurePattern(params: {
    declaredConfidence: number;
    isReverted: boolean;
    rawDelta: number;
    reversalReason?: string;
    unknownsCount: number;
    roundsCount: number;
    trippedContractId?: string;
  }): FailurePattern | undefined {
    if (!params.isReverted && params.rawDelta < 0.50) {
      return undefined;
    }

    const reason = (params.reversalReason || '').toLowerCase();

    // 1. Invariant Breach: Explicit operational contract tripped or SLA violation
    if (params.trippedContractId || reason.includes('contract') || reason.includes('threshold') || reason.includes('breach')) {
      return 'INVARIANT_BREACH';
    }

    // 2. Overconfidence: High confidence (>= 0.85) declared on failed decision
    if (params.declaredConfidence >= 0.85) {
      return 'OVERCONFIDENCE';
    }

    // 3. Missing Evidence: Key unknowns were unaddressed or uninvestigated
    if (params.unknownsCount >= 2 || reason.includes('unknown') || reason.includes('unforeseen') || reason.includes('unexpected')) {
      return 'MISSING_EVIDENCE';
    }

    // 4. Premature Consensus: Low rounds or consensus without thorough debate
    if (params.roundsCount <= 1) {
      return 'PREMATURE_CONSENSUS';
    }

    return 'INVARIANT_BREACH';
  }

  /**
   * Tracks and evaluates production outcome for a stored decision
   */
  public trackDecisionOutcome(
    decision: StoredDecision,
    input: OutcomeTrackingInput
  ): OutcomeTrackingResult {
    const isReverted = input.status === 'REVERTED' || !!input.reversalReason || !!input.trippedContractId;
    const finalStatus = isReverted ? 'REVERTED' : (input.status || 'SURVIVED');

    const expectedOutcomeStr = decision.auditableDecision?.expectedOutcome || 'Stable production operation within SLAs';
    const deltaReport = this.computeOutcomeDelta(
      expectedOutcomeStr,
      input.actualOutcome,
      input.observedMetrics,
      isReverted
    );

    const unknownsCount = decision.auditableDecision?.unknowns?.length || 0;
    const roundsCount = (decision.metadata?.deliberationRoundsCount as number) || 2;

    const failurePattern = this.classifyFailurePattern({
      declaredConfidence: decision.declaredConfidence,
      isReverted,
      rawDelta: deltaReport.rawDelta,
      reversalReason: input.reversalReason,
      unknownsCount,
      roundsCount,
      trippedContractId: input.trippedContractId,
    });

    let postMortem: PostMortemAnalysis | undefined;
    let agentReputationDeltas: Record<AgentId, number> | undefined;

    // Find minority dissenting agent
    const dissentingAgent: AgentId = (decision.metadata?.dissentingAgent as AgentId) || 'BALTHASAR';

    if (finalStatus === 'REVERTED') {
      // 1. Run post-mortem autopsy
      const reversalReason = input.reversalReason || `Outcome failed with deviation ${(deltaReport.rawDelta * 100).toFixed(1)}%: ${input.actualOutcome}`;
      postMortem = this.postMortemEngine.analyzeReversal({
        decisionId: decision.decisionId,
        originalDecision: decision.verdict,
        declaredConfidence: decision.declaredConfidence,
        reversalReason,
        minorityReport: {
          decision: decision.verdict,
          supportingFactors: [],
          minorityConcern: decision.auditableDecision?.minorityConcern || 'Operational risk under load',
          reversalConditions: decision.auditableDecision?.reversalConditions || [],
          dissentingAgent,
        },
      });

      agentReputationDeltas = postMortem.agentReputationDeltas;

      // 2. Adjust permanent agent reputations
      this.reputationRegistry.applyPostMortem(postMortem, decision.domain);

      // 3. Update calibration engine
      this.calibrationEngine.recordOutcome({
        decisionId: decision.decisionId,
        timestamp: decision.timestamp,
        declaredConfidence: decision.declaredConfidence,
        status: 'REVERTED',
        reversalReason,
        trippedContractId: input.trippedContractId,
        reversalTimestamp: input.timestamp || new Date().toISOString(),
      });
    } else {
      // SURVIVED clean execution
      this.reputationRegistry.recordSurvival(decision.decisionId, decision.domain, dissentingAgent);

      this.calibrationEngine.recordOutcome({
        decisionId: decision.decisionId,
        timestamp: decision.timestamp,
        declaredConfidence: decision.declaredConfidence,
        status: 'SURVIVED',
      });
    }

    return {
      decisionId: decision.decisionId,
      status: finalStatus,
      deltaReport,
      failurePattern,
      postMortem,
      reputationAdjusted: true,
      agentReputationDeltas,
    };
  }

  /**
   * Helper to extract numeric target values and comparison operator from expected outcome text
   */
  private extractTargetConstraint(expectedText: string, metricKey: string): { target: number; operator: '<' | '>' | '==' } | null {
    const text = expectedText.toLowerCase();
    const key = metricKey.toLowerCase();

    let pattern: RegExp | null = null;
    if (key.includes('latency') || key.includes('ms')) {
      pattern = /([<>]=?|==)?\s*(\d+(?:\.\d+)?)\s*ms/;
    } else if (key.includes('error') || key.includes('rate') || key.includes('percent')) {
      pattern = /([<>]=?|==)?\s*(\d+(?:\.\d+)?)\s*%/;
    } else if (key.includes('cost') || key.includes('usd')) {
      pattern = /([<>]=?|==)?\s*\$?\s*(\d+(?:\.\d+)?)/;
    }

    if (!pattern) return null;

    const match = text.match(pattern);
    if (!match) return null;

    const opStr = match[1] || '<';
    const target = parseFloat(match[2]);
    const operator: '<' | '>' | '==' = opStr.includes('>') ? '>' : (opStr.includes('==') ? '==' : '<');

    return { target, operator };
  }
}

export const globalOutcomeTracker = new OutcomeTracker();
