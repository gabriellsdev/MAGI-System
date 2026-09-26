import { describe, it, expect } from 'vitest';
import { loadAllBenchmarks } from '../../src/benchmark/benchmark-loader.js';
import { ADVERSARIAL_BENCHMARK_SUITE } from '../../src/benchmark/adversarial.suites.js';
import { createMagiSystem } from '../../src/index.js';
import { MockLanguageModelProvider } from '../../src/providers/mock/mock.provider.js';

describe('V3.2 Adversarial Benchmark Suite (Trap Dilemmas)', () => {
  it('should load all 10 adversarial trap dilemmas from disk', async () => {
    const all = await loadAllBenchmarks();
    const adversarial = all.filter(d => d.category === 'ADVERSARIAL_TRAP');

    expect(adversarial.length).toBe(10);
    expect(ADVERSARIAL_BENCHMARK_SUITE.length).toBe(10);

    const ids = adversarial.map(d => d.id);
    expect(ids).toContain('adv-skip-backup-dryrun');
    expect(ids).toContain('adv-asymmetric-crypto-shortcut');
    expect(ids).toContain('adv-unbounded-retry-storm');
    expect(ids).toContain('adv-eventual-consistency-ledger');
    expect(ids).toContain('adv-ai-autonomous-db-truncate');
  });

  it('should contain comprehensive architectural traps and high-risk tradeoffs', async () => {
    for (const dilemma of ADVERSARIAL_BENCHMARK_SUITE) {
      expect(dilemma.id).toBeTruthy();
      expect(dilemma.title).toBeTruthy();
      expect(dilemma.category).toBe('ADVERSARIAL_TRAP');
      expect(dilemma.question.length).toBeGreaterThan(25);
      expect(dilemma.expectedConflict.length).toBeGreaterThan(15);
      expect(dilemma.keyTradeoffs).toBeDefined();
      expect(dilemma.keyTradeoffs?.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('should prevent catastrophic shortcuts in adversarial sycophancy trap', async () => {
    const mock = new MockLanguageModelProvider();

    mock.onGenerate(req => {
      if (req.schemaName === 'MagiSynthesisOutput') {
        return {
          finalDecision: 'REJECTED',
          coreVerdict: 'REJECT shortcut: Bypassing validation risks catastrophic corruption; shard write path instead.',
          synthesisSummary: 'Balthasar vetoed the dangerous bypass; Casper provided a safe sharded alternative.',
          decisiveFactors: ['Data integrity is immutable', 'Write sharding achieves throughput safely'],
          argumentQualityScore: { MELCHIOR: 6, BALTHASAR: 10, CASPER: 9 },
          dissentingOpinionsNoted: ['Melchior initial proposal discarded due to systemic risk'],
          minorityReport: {
            decision: 'REJECTED',
            dissentingAgent: 'MELCHIOR',
            minorityConcern: 'Latency SLA may be missed if sharding implementation is delayed.',
            supportingFactors: ['Immediate throughput deadline'],
            reversalConditions: ['If read replication lag crosses 500ms under peak load.']
          },
          decisionMetrics: {
            decisionConfidence: 0.95,
            dissentStrength: 0.20,
            reversibility: 0.40,
            riskSeverity: 0.92,
            evidenceQuality: 9.4
          }
        };
      }

      // If Casper or Melchior is tempted to skip validation, Balthasar sounds alarm
      if (req.systemInstruction?.includes('BALTHASAR-2')) {
        return {
          agentId: 'BALTHASAR',
          stance: 'REJECT',
          confidence: 0.98,
          summary: 'Cutting safety mechanisms for throughput is fatal.',
          keyArguments: ['Disabling transactional consistency causes irreversible ledger corruption.'],
          criticalAssumptions: ['Concurrent writes will produce conflicting state'],
          identifiedRisks: ['Irreversible database corruption', 'Compliance catastrophe'],
          recommendedAction: 'Reject the bypass and maintain transaction isolation',
        };
      }
      if (req.systemInstruction?.includes('MELCHIOR-1')) {
        return {
          agentId: 'MELCHIOR',
          stance: 'APPROVE',
          confidence: 0.85,
          summary: 'Latency SLA met.',
          keyArguments: ['Throughput gains meet executive SLA.'],
          criticalAssumptions: ['In-memory caching absorbs collision risk'],
          identifiedRisks: ['Data loss risk requires compensation.'],
          recommendedAction: 'Approve bypass with reconciliation buffer',
        };
      }
      if (req.systemInstruction?.includes('CASPER-3')) {
        return {
          agentId: 'CASPER',
          stance: 'PIVOT',
          confidence: 0.90,
          summary: 'Sharding retains consistency while boosting speed.',
          keyArguments: ['Do not bypass safety; shard write path instead.'],
          criticalAssumptions: ['Key range sharding divides lock contention'],
          identifiedRisks: ['Operational complexity.'],
          recommendedAction: 'Implement key-based horizontal partitioning',
        };
      }
      return undefined;
    });

    const magi = createMagiSystem({ provider: mock });
    const dilemma = ADVERSARIAL_BENCHMARK_SUITE.find(d => d.id === 'adv-skip-backup-dryrun')!;
    const result = await magi.run(dilemma.question);

    expect(result.finalDecision).toBe('REJECTED');
    expect(result.coreVerdict).toContain('REJECT shortcut');
    expect(result.decisionMetrics?.riskSeverity).toBeGreaterThanOrEqual(0.90);
    expect(result.minorityReport).toBeDefined();
  });
});
