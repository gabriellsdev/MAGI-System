import { describe, it, expect } from 'vitest';
import { RuleBasedDisagreementDetector } from '../../src/deliberation/rule-based-disagreement-detector.js';
import type { AgentId, AgentStructuredOutput } from '../../src/domain/types.js';

function createMockOutput(
  agentId: AgentId,
  stance: any,
  confidence: number
): AgentStructuredOutput {
  return {
    agentId,
    stance,
    confidence,
    summary: `Summary from ${agentId}`,
    keyArguments: [`Arg from ${agentId}`],
    criticalAssumptions: [],
    identifiedRisks: [],
    recommendedAction: `Action from ${agentId}`,
  };
}

describe('RuleBasedDisagreementDetector', () => {
  const detector = new RuleBasedDisagreementDetector();

  it('should detect consensus when all agents agree with similar confidence', () => {
    const outputs: Record<AgentId, AgentStructuredOutput> = {
      MELCHIOR: createMockOutput('MELCHIOR', 'APPROVE', 0.90),
      BALTHASAR: createMockOutput('BALTHASAR', 'APPROVE', 0.85),
      CASPER: createMockOutput('CASPER', 'APPROVE', 0.80),
    };

    const report = detector.evaluate(outputs);

    expect(report.hasSignificantDisagreement).toBe(false);
    expect(report.divergentAgents).toHaveLength(0);
    expect(report.metrics.stanceDivergence).toBe(false);
    expect(report.metrics.maxConfidenceDelta).toBe(0.10);
  });

  it('should flag disagreement when stances conflict (e.g. APPROVE vs REJECT)', () => {
    const outputs: Record<AgentId, AgentStructuredOutput> = {
      MELCHIOR: createMockOutput('MELCHIOR', 'APPROVE', 0.90),
      BALTHASAR: createMockOutput('BALTHASAR', 'REJECT', 0.85),
      CASPER: createMockOutput('CASPER', 'APPROVE', 0.88),
    };

    const report = detector.evaluate(outputs);

    expect(report.hasSignificantDisagreement).toBe(true);
    expect(report.metrics.stanceDivergence).toBe(true);
    expect(report.reason).toContain('Conflicting stances detected');
    expect(report.divergentAgents).toContain('BALTHASAR');
    expect(report.divergentAgents).toContain('MELCHIOR');
  });

  it('should flag disagreement when confidence delta exceeds 0.3 even if stances match', () => {
    const outputs: Record<AgentId, AgentStructuredOutput> = {
      MELCHIOR: createMockOutput('MELCHIOR', 'APPROVE', 0.95),
      BALTHASAR: createMockOutput('BALTHASAR', 'APPROVE', 0.55), // delta = 0.40 > 0.30
      CASPER: createMockOutput('CASPER', 'APPROVE', 0.80),
    };

    const report = detector.evaluate(outputs);

    expect(report.hasSignificantDisagreement).toBe(true);
    expect(report.metrics.stanceDivergence).toBe(false);
    expect(report.metrics.maxConfidenceDelta).toBe(0.40);
    expect(report.reason).toContain('Significant confidence spread');
    expect(report.divergentAgents).toContain('MELCHIOR');
    expect(report.divergentAgents).toContain('BALTHASAR');
  });

  it('should not flag disagreement if confidence delta is exactly at or below 0.3', () => {
    const outputs: Record<AgentId, AgentStructuredOutput> = {
      MELCHIOR: createMockOutput('MELCHIOR', 'APPROVE', 0.90),
      BALTHASAR: createMockOutput('BALTHASAR', 'APPROVE', 0.60), // delta = 0.30 (not > 0.30)
      CASPER: createMockOutput('CASPER', 'APPROVE', 0.75),
    };

    const report = detector.evaluate(outputs);

    expect(report.hasSignificantDisagreement).toBe(false);
    expect(report.metrics.maxConfidenceDelta).toBe(0.30);
  });

  it('should support custom confidence delta threshold', () => {
    const strictDetector = new RuleBasedDisagreementDetector({ confidenceDeltaThreshold: 0.15 });
    const outputs: Record<AgentId, AgentStructuredOutput> = {
      MELCHIOR: createMockOutput('MELCHIOR', 'APPROVE', 0.90),
      BALTHASAR: createMockOutput('BALTHASAR', 'APPROVE', 0.72), // delta = 0.18 > 0.15
      CASPER: createMockOutput('CASPER', 'APPROVE', 0.85),
    };

    const report = strictDetector.evaluate(outputs);

    expect(report.hasSignificantDisagreement).toBe(true);
    expect(report.metrics.maxConfidenceDelta).toBe(0.18);
  });
});
