import { describe, it, expect } from 'vitest';
import { runBenchmarkSuite } from '../../src/benchmark/benchmark-runner.js';
import { STANDARD_BENCHMARK_SUITE } from '../../src/benchmark/benchmark.suites.js';

describe('Benchmark Evaluation Suite (V1.3)', () => {
  it('should define dilemmas across all key categories', () => {
    expect(STANDARD_BENCHMARK_SUITE.length).toBeGreaterThanOrEqual(4);

    const categories = new Set(STANDARD_BENCHMARK_SUITE.map(d => d.category));
    expect(categories.has('SOCIETAL_GOVERNANCE')).toBe(true);
    expect(categories.has('SYSTEM_ARCHITECTURE')).toBe(true);
    expect(categories.has('AUTONOMOUS_RISK')).toBe(true);
  });

  it('should include the Evangelion society governance dilemma', () => {
    const evaDilemma = STANDARD_BENCHMARK_SUITE.find(d => d.id === 'societal-governance');
    expect(evaDilemma).toBeDefined();
    expect(evaDilemma?.title).toContain('MAGI Cybernetic Governance');
    expect(evaDilemma?.question).toContain('Magi supercomputer');
  });

  it('should execute benchmark suite in mock mode and return complete summary', async () => {
    const summary = await runBenchmarkSuite({ dilemmas: STANDARD_BENCHMARK_SUITE, useMock: true });

    expect(summary).toBeDefined();
    expect(summary.totalDilemmas).toBe(STANDARD_BENCHMARK_SUITE.length);
    expect(summary.scorecards.length).toBe(STANDARD_BENCHMARK_SUITE.length);
    expect(summary.consensusRate).toBeGreaterThanOrEqual(0);
    expect(summary.consensusRate).toBeLessThanOrEqual(1);
    expect(summary.averageDurationMs).toBeGreaterThan(0);
    expect(summary.averageRounds).toBeGreaterThanOrEqual(0);

    // Verify scorecard entries
    for (const card of summary.scorecards) {
      expect(card.dilemmaId).toBeDefined();
      expect(card.title).toBeDefined();
      expect(card.category).toBeDefined();
      expect(card.finalDecision).toBeDefined();
      expect(card.qualityScores.MELCHIOR).toBeGreaterThan(0);
      expect(card.qualityScores.BALTHASAR).toBeGreaterThan(0);
      expect(card.qualityScores.CASPER).toBeGreaterThan(0);
      expect(card.coreVerdict).toBeDefined();
    }
  });

  it('should execute dynamically loaded benchmarks with limit', async () => {
    const summary = await runBenchmarkSuite({ limit: 3, useMock: true });
    expect(summary.totalDilemmas).toBe(3);
    expect(summary.scorecards.length).toBe(3);
  });
});
