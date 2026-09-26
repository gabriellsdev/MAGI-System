import { describe, it, expect } from 'vitest';
import { runEvaluationSuite } from '../../src/evaluation/eval-runner.js';
import type { BenchmarkDilemma } from '../../src/benchmark/benchmark.types.js';

describe('EvaluationRunner (V3 End-to-End Evaluation & Pareto Frontier)', () => {
  const testDilemmas: BenchmarkDilemma[] = [
    {
      id: 'test-dilemma-1',
      title: 'Monolith to Microservices Evaluation',
      category: 'SYSTEM_ARCHITECTURE',
      question: 'Should our engineering organization migrate to microservices?',
      description: 'Decomposing a monolith into microservices.',
      expectedConflict: 'Velocity vs distributed complexity.',
      keyTradeoffs: ['Decoupling vs distributed latency', 'Observability overhead vs team independence'],
    },
    {
      id: 'test-dilemma-2',
      title: 'PostgreSQL vs MongoDB Evaluation',
      category: 'SYSTEM_ARCHITECTURE',
      question: 'Should our new platform use PostgreSQL or MongoDB?',
      description: 'Relational vs document database choice.',
      expectedConflict: 'ACID rigor vs schema flexibility.',
      keyTradeoffs: ['Strict relational integrity vs dynamic schema', 'Query ergonomics vs horizontal scaling'],
    },
  ];

  it('should execute evaluation suite in mock mode and produce complete aggregate summary', async () => {
    const summary = await runEvaluationSuite({
      dilemmas: testDilemmas,
      useMock: true,
      useCache: false,
      saveReport: false,
    });

    expect(summary).toBeDefined();
    expect(summary.totalDilemmas).toBe(2);
    expect(summary.scorecards.length).toBe(2);

    // Verify win rate calculations
    expect(summary.magiWinRate).toBeGreaterThanOrEqual(0);
    expect(summary.magiWinRate).toBeLessThanOrEqual(1);
    expect(summary.singleWinRate).toBeGreaterThanOrEqual(0);
    expect(summary.tieRate).toBeGreaterThanOrEqual(0);
    expect(summary.magiWinRate + summary.singleWinRate + summary.tieRate).toBeCloseTo(1.0, 2);

    // Verify dimension score averages
    expect(summary.averageScores.single.reasoningQuality).toBeGreaterThan(0);
    expect(summary.averageScores.magi.reasoningQuality).toBeGreaterThan(0);
    expect(summary.averageScores.single.completeness).toBeGreaterThan(0);
    expect(summary.averageScores.magi.completeness).toBeGreaterThan(0);
    expect(summary.averageScores.single.robustness).toBeGreaterThan(0);
    expect(summary.averageScores.magi.robustness).toBeGreaterThan(0);
    expect(summary.averageScores.single.actionability).toBeGreaterThan(0);
    expect(summary.averageScores.magi.actionability).toBeGreaterThan(0);
    expect(summary.averageScores.single.compositeOverall).toBeGreaterThan(0);
    expect(summary.averageScores.magi.compositeOverall).toBeGreaterThan(0);

    // Verify resource tradeoffs
    expect(summary.resourceTradeoffs.averageLatencyMultiplier).toBeGreaterThan(0);
    expect(summary.resourceTradeoffs.averageTokenMultiplier).toBeGreaterThan(0);
    expect(summary.resourceTradeoffs.averageCostMultiplier).toBeGreaterThan(0);

    // Verify individual scorecards
    for (const card of summary.scorecards) {
      expect(card.dilemmaId).toBeDefined();
      expect(card.title).toBeDefined();
      expect(card.category).toBe('SYSTEM_ARCHITECTURE');
      expect(['MAGI', 'SINGLE', 'TIE']).toContain(card.overallWinner);
      expect(card.singleScores.reasoningQuality).toBeGreaterThan(0);
      expect(card.magiScores.reasoningQuality).toBeGreaterThan(0);
      expect(card.metrics.latencyMultiplier).toBeGreaterThan(0);
      expect(card.metrics.tokenMultiplier).toBeGreaterThan(0);
    }
  });

  it('should support position swapping in evaluation suite', async () => {
    const summary = await runEvaluationSuite({
      dilemmas: testDilemmas.slice(0, 1),
      useMock: true,
      useCache: false,
      positionSwap: true,
      saveReport: false,
    });

    expect(summary.totalDilemmas).toBe(1);
    expect(summary.scorecards[0].comparativeAnalysis).toContain('Position-Swapped Evaluation');
  });
});
