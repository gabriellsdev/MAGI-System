import { describe, it, expect, beforeEach } from 'vitest';
import { AgentReputationRegistry } from '../../src/memory/agent-reputation-registry.js';
import type { PostMortemAnalysis } from '../../src/domain/types.js';

describe('AgentReputationRegistry (V4.2)', () => {
  let registry: AgentReputationRegistry;

  beforeEach(() => {
    registry = new AgentReputationRegistry(true); // empty baseline for clean unit testing
  });

  it('should initialize empty baseline with default 7.0 score', () => {
    const melchior = registry.getReputation('MELCHIOR');
    expect(melchior.agentId).toBe('MELCHIOR');
    expect(melchior.baseReputation).toBe(7.0);
    expect(melchior.totalDecisionsInvolved).toBe(0);

    const balthasar = registry.getReputation('BALTHASAR');
    expect(balthasar.baseReputation).toBe(7.0);

    const casper = registry.getReputation('CASPER');
    expect(casper.baseReputation).toBe(7.0);
  });

  it('should compute domain weight modifier based on domain reputation', () => {
    // With 7.0 baseline, modifier should be 0.0
    expect(registry.getDomainWeightModifier('BALTHASAR', 'DATABASE')).toBe(0.0);

    // Re-seed default enterprise profiles
    const seeded = new AgentReputationRegistry(false);
    // Balthasar has 8.6 in DATABASE -> (8.6 - 7.0) * 0.5 = 0.8
    const balthasarDbMod = seeded.getDomainWeightModifier('BALTHASAR', 'DATABASE');
    expect(balthasarDbMod).toBeGreaterThanOrEqual(0.7);

    // Melchior has 8.2 in ARCHITECTURE -> (8.2 - 7.0) * 0.5 = 0.6
    const melchiorArchMod = seeded.getDomainWeightModifier('MELCHIOR', 'ARCHITECTURE');
    expect(melchiorArchMod).toBeGreaterThanOrEqual(0.5);
  });

  it('should adjust reputation upon minority vindication post-mortem', () => {
    const postMortem: PostMortemAnalysis = {
      decisionId: 'TEST-DEC-01',
      analysisTimestamp: new Date().toISOString(),
      originalDecision: 'CONDITIONAL_PASS',
      declaredConfidence: 0.90,
      dissentingAgent: 'BALTHASAR',
      reversalReason: 'Connection pool starved under load',
      minorityVindicated: true,
      minorityVindicationScore: 0.95,
      rootCauseAttribution: 'Pool handles exhausted as Balthasar warned',
      majorityFlaw: 'Melchior and Casper dismissed tail risk',
      recommendedAdjustments: ['Enforce backpressure'],
      agentReputationDeltas: {
        MELCHIOR: -0.15,
        BALTHASAR: 0.25,
        CASPER: -0.15,
      },
    };

    registry.applyPostMortem(postMortem, 'DATABASE');

    const balthasar = registry.getReputation('BALTHASAR');
    expect(balthasar.baseReputation).toBe(7.25);
    expect(balthasar.minorityVindications).toBe(1);
    expect(balthasar.domainReputations.DATABASE.score).toBeGreaterThan(7.0);
    expect(balthasar.domainReputations.DATABASE.vindicationCount).toBe(1);

    const melchior = registry.getReputation('MELCHIOR');
    expect(melchior.baseReputation).toBe(6.85);
    expect(melchior.domainReputations.DATABASE.score).toBeLessThan(7.0);
  });

  it('should record clean survival and penalize false alarm dissent', () => {
    registry.recordSurvival('DEC-SURV-1', 'SECURITY', 'BALTHASAR');

    const balthasar = registry.getReputation('BALTHASAR');
    expect(balthasar.falseAlarms).toBe(1);
    expect(balthasar.baseReputation).toBeLessThan(7.0);

    const melchior = registry.getReputation('MELCHIOR');
    expect(melchior.survivedDecisions).toBe(1);
    expect(melchior.baseReputation).toBeGreaterThan(7.0);
    expect(melchior.domainReputations.SECURITY.score).toBeGreaterThanOrEqual(7.05);
  });
});
