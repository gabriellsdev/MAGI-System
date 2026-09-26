import { describe, it, expect } from 'vitest';
import { MagiDatasetBuilder } from '../../src/distillation/dataset-builder.js';
import { MagiNativeModelAdapter } from '../../src/distillation/native-model-adapter.js';
import { DistillationBenchmarkRunner } from '../../src/distillation/distillation-benchmark.js';
import { createMagiSystem } from '../../src/index.js';
import { MockLanguageModelProvider } from '../../src/providers/mock/mock.provider.js';
import { resolvedInRoundOneFixtures } from '../../src/providers/mock/fixtures.js';

describe('V4.3 Knowledge Distillation & Native Adapter Pipeline', () => {
  it('should run full distillation pipeline: dataset extraction -> DPO pairs -> benchmark profiling', async () => {
    // 1. Build training dataset from Decision Memory
    const datasetBuilder = new MagiDatasetBuilder();
    const stats = datasetBuilder.getDatasetStats();
    expect(stats.totalEntries).toBeGreaterThanOrEqual(3);

    const sftJsonl = datasetBuilder.exportSft();
    expect(sftJsonl.length).toBeGreaterThan(100);

    const dpoJsonl = datasetBuilder.exportDpo();
    expect(dpoJsonl.length).toBeGreaterThan(100);

    // 2. Set up Multi-Agent Deliberation system with Mock Provider
    const multiAgentMock = new MockLanguageModelProvider();
    multiAgentMock.onGenerate(req => {
      if (req.schemaName === 'MagiSynthesisOutput') {
        return resolvedInRoundOneFixtures.synthesis;
      }
      const isRound1 = req.systemInstruction?.includes('DELIBERATION ROUND 1');
      if (req.systemInstruction?.includes('MELCHIOR-1')) {
        return isRound1 ? resolvedInRoundOneFixtures.round1.MELCHIOR : resolvedInRoundOneFixtures.round0.MELCHIOR;
      }
      if (req.systemInstruction?.includes('BALTHASAR-2')) {
        return isRound1 ? resolvedInRoundOneFixtures.round1.BALTHASAR : resolvedInRoundOneFixtures.round0.BALTHASAR;
      }
      if (req.systemInstruction?.includes('CASPER-3')) {
        return isRound1 ? resolvedInRoundOneFixtures.round1.CASPER : resolvedInRoundOneFixtures.round0.CASPER;
      }
      return undefined;
    });

    const multiAgentSystem = createMagiSystem({ provider: multiAgentMock });

    // 3. Set up Distilled Native Adapter with Mock Provider
    const distilledMock = new MockLanguageModelProvider();
    distilledMock.onGenerate(() => ({
      analyses: {
        MELCHIOR: {
          stance: 'APPROVE',
          confidence: 0.90,
          summary: 'Technical architecture sound.',
          arguments: ['Direct scaling throughput'],
        },
        BALTHASAR: {
          stance: 'CONDITIONAL',
          confidence: 0.85,
          summary: 'Operational safeguards mandatory.',
          identifiedRisks: ['SLA latency drift under peak concurrency'],
        },
        CASPER: {
          stance: 'APPROVE',
          confidence: 0.80,
          summary: 'Pragmatic team adoption curve.',
          alternatives: ['Canary deployment window'],
        },
      },
      synthesis: {
        finalDecision: 'CONDITIONAL_PASS',
        coreVerdict: 'Proceed with mandatory canary rollback gates.',
        confidence: 0.88,
        decisiveFactors: ['Automated circuit breakers', 'Direct SLA telemetry gating'],
        minorityConcern: 'Risk of latency degradation under peak traffic surges',
        reversalConditions: ['p99_latency_ms > 400', 'error_rate > 1%'],
        expectedOutcome: 'P99 latency < 250ms, zero SLA breach',
      },
    }));

    const nativeAdapter = new MagiNativeModelAdapter({ provider: distilledMock });

    // 4. Run Distillation Benchmark Comparison
    const runner = new DistillationBenchmarkRunner(multiAgentSystem, nativeAdapter);
    const benchmarkQuestions = [
      'Should we migrate our core database to PostgreSQL?',
      'Should we adopt event-driven microservices architecture?',
    ];

    const report = await runner.runBenchmark(benchmarkQuestions);

    expect(report.casesEvaluated).toBe(2);
    expect(report.overallAgreementRate).toBeGreaterThanOrEqual(0.5); // At least one verdict matches
    expect(report.averageTokenSavingsPercent).toBeGreaterThanOrEqual(60);
    expect(report.averageSpeedupFactor).toBeGreaterThanOrEqual(1.0);
    expect(report.comparisons).toHaveLength(2);

    report.comparisons.forEach(c => {
      expect(c.distilledTokens).toBeLessThan(c.multiAgentTokens);
      expect(c.tokenSavingsPercent).toBeGreaterThan(50);
    });
  });
});
