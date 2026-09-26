import { describe, it, expect } from 'vitest';
import { MagiNativeModelAdapter } from '../../src/distillation/native-model-adapter.js';
import { MockLanguageModelProvider } from '../../src/providers/mock/mock.provider.js';

describe('MagiNativeModelAdapter (V4.3)', () => {
  it('should execute single-pass distilled deliberation and parse structured tripartite outputs', async () => {
    const mockProvider = new MockLanguageModelProvider();
    mockProvider.onGenerate(() => ({
      analyses: {
        MELCHIOR: {
          stance: 'APPROVE',
          confidence: 0.90,
          summary: 'High throughput binary serialization delivers direct technical advantage.',
          arguments: ['Benchmark speedup', 'Zero schema drift via Protobuf CI'],
        },
        BALTHASAR: {
          stance: 'CONDITIONAL',
          confidence: 0.85,
          summary: 'Client proxy backward compatibility and edge circuit breaker requirements.',
          identifiedRisks: ['Downstream proxy latency drop', 'Uncaught gRPC error code translation'],
        },
        CASPER: {
          stance: 'APPROVE',
          confidence: 0.80,
          summary: 'Pragmatic phased migration roadmap with fallback.',
          alternatives: ['Canary proxy dual-routing'],
        },
      },
      synthesis: {
        finalDecision: 'CONDITIONAL_PASS',
        coreVerdict: 'Approve gRPC migration conditional on dual-routing proxy and 15-minute canary window.',
        confidence: 0.88,
        decisiveFactors: ['Protobuf schema validation', 'Operational canary rollback triggers'],
        minorityConcern: 'Risk of uncaught gRPC error code translation under unexpected edge proxy surges',
        reversalConditions: ['gRPC error rate > 0.5%', 'p99_latency_ms > 250'],
        expectedOutcome: 'P99 latency < 50ms, zero downtime',
      },
    }));

    const adapter = new MagiNativeModelAdapter({ provider: mockProvider });
    const result = await adapter.deliberate('Should we migrate internal RPC to gRPC?', {
      domain: 'ARCHITECTURE',
    });

    expect(result.synthesis.finalDecision).toBe('CONDITIONAL_PASS');
    expect(result.synthesis.coreVerdict).toContain('Approve gRPC migration');
    expect(result.synthesis.auditableDecision).toBeDefined();
    expect(result.synthesis.auditableDecision?.verdict).toBe('CONDITIONAL_PASS');
    expect(result.synthesis.auditableDecision?.risks).toHaveLength(2);
    expect(result.synthesis.auditableDecision?.reversalConditions).toHaveLength(2);

    expect(result.profile.tokenSavingsPercent).toBeGreaterThanOrEqual(50);
    expect(result.profile.speedupFactor).toBeGreaterThanOrEqual(2.0);
    expect(result.escalationRecommended).toBe(false);
  });

  it('should flag escalation when distilled pass exhibits high uncertainty or epistemic halt', async () => {
    const mockProvider = new MockLanguageModelProvider();
    mockProvider.onGenerate(() => ({
      analyses: {
        MELCHIOR: {
          stance: 'REJECT',
          confidence: 0.65,
          summary: 'Insufficient data on distributed storage performance.',
          arguments: ['Unverified IOPS throughput under pressure'],
        },
        BALTHASAR: {
          stance: 'REJECT',
          confidence: 0.60,
          summary: 'Catastrophic risk of distributed split-brain partition.',
          identifiedRisks: ['Irreversible data corruption'],
        },
        CASPER: {
          stance: 'CONDITIONAL',
          confidence: 0.55,
          summary: 'Too risky for immediate production adoption.',
          alternatives: ['Retain current primary database'],
        },
      },
      synthesis: {
        finalDecision: 'EPISTEMIC_HALT',
        coreVerdict: 'Refusing autonomous execution. High irreversible risk with low epistemic certainty.',
        confidence: 0.62,
        decisiveFactors: ['Irreversible one-way door split-brain threat'],
        minorityConcern: 'Data loss in distributed partition',
        reversalConditions: ['Any unrecoverable node desync'],
        expectedOutcome: 'Retain current database',
      },
    }));

    const adapter = new MagiNativeModelAdapter({ provider: mockProvider });
    const result = await adapter.deliberate('Should we switch core transaction ledger to untested experimental database?');

    expect(result.synthesis.finalDecision).toBe('EPISTEMIC_HALT');
    expect(result.escalationRecommended).toBe(true);
    expect(result.escalationReason).toContain('uncertainty');
  });
});
