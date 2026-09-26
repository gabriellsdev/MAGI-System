import { describe, it, expect, beforeEach } from 'vitest';
import { ReversalPostMortemEngine } from '../../src/monitoring/post-mortem-engine.js';
import type { MinorityReport } from '../../src/domain/types.js';

describe('V3.4 Reversal Post-Mortem Autopsy Engine', () => {
  let engine: ReversalPostMortemEngine;

  beforeEach(() => {
    engine = new ReversalPostMortemEngine();
    engine.reset(true);
  });

  it('should score high minority vindication when failure matches dissenting agent warning', () => {
    const minorityReport: MinorityReport = {
      decision: 'CONDITIONAL_PASS',
      dissentingAgent: 'BALTHASAR',
      minorityConcern: 'Connection pool burst exhaustion and thread starvation under peak traffic.',
      supportingFactors: ['Load spikes in canary'],
      reversalConditions: ['Pool saturation > 90%'],
    };

    const analysis = engine.analyzeReversal({
      decisionId: 'DEC-POST-1',
      originalDecision: 'CONDITIONAL_PASS',
      declaredConfidence: 0.92,
      reversalReason: 'Severe connection pool exhaustion led to cascading timeouts under traffic burst.',
      minorityReport,
    });

    expect(analysis.minorityVindicated).toBe(true);
    expect(analysis.minorityVindicationScore).toBeGreaterThanOrEqual(0.70);
    expect(analysis.dissentingAgent).toBe('BALTHASAR');
    // Balthasar should receive reputation boost while majority is penalized
    expect(analysis.agentReputationDeltas.BALTHASAR).toBeGreaterThan(0);
    expect(analysis.agentReputationDeltas.MELCHIOR).toBeLessThan(0);
    expect(analysis.agentReputationDeltas.CASPER).toBeLessThan(0);
    expect(analysis.majorityFlaw).toContain('theoretical optimism');
  });

  it('should analyze reversal triggered by an operational contract breach', () => {
    const analysis = engine.analyzeReversal({
      decisionId: 'DEC-POST-2',
      originalDecision: 'CONSENSUS_REACHED',
      declaredConfidence: 0.88,
      reversalReason: 'Breached operational contract p99_latency_ms > 500',
      trippedContract: {
        id: 'rc-lat',
        metric: 'p99_latency_ms',
        operator: '>',
        threshold: 500,
        window: '15m',
        action: 'CIRCUIT_BREAK',
        description: 'P99 response latency exceeds 500ms under load',
        status: 'TRIPPED',
        trippedValue: 780,
      },
    });

    expect(analysis.minorityVindicated).toBe(true);
    expect(analysis.minorityVindicationScore).toBeGreaterThanOrEqual(0.90);
    expect(analysis.recommendedAdjustments.length).toBeGreaterThanOrEqual(2);
  });
});
