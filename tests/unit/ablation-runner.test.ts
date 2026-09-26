import { describe, it, expect } from 'vitest';
import { runAblationExperiment } from '../../src/evaluation/ablation-runner.js';
import type { BenchmarkDilemma } from '../../src/benchmark/benchmark.types.js';

describe('V3 Stage 4: Ablation Studies & Architectural Comparison', () => {
  const testDilemmas: BenchmarkDilemma[] = [
    {
      id: 'ablation-dilemma-1',
      title: 'Monolith to Microservices Migration',
      category: 'SYSTEM_ARCHITECTURE',
      question: 'Should our engineering organization decompose the legacy monolith into microservices?',
      description: 'Architectural evaluation of monolith decomposition.',
      expectedConflict: 'Developer velocity vs distributed operational overhead.',
      keyTradeoffs: ['Decoupling vs distributed transactions', 'Team autonomy vs observability burden'],
    },
    {
      id: 'ablation-dilemma-2',
      title: 'Kubernetes vs Serverless Container Migration',
      category: 'DEVOPS_INFRASTRUCTURE',
      question: 'Should we migrate our workloads to self-hosted Kubernetes or managed Serverless containers (Cloud Run)?',
      description: 'Infrastructure runtime evaluation.',
      expectedConflict: 'Granular control vs operational simplicity.',
      keyTradeoffs: ['Cluster management overhead vs cold start latency', 'Cost predictability vs scale-to-zero'],
    },
  ];

  it('should execute full ablation study across all 5 configurations in mock mode', async () => {
    const summary = await runAblationExperiment({
      dilemmas: testDilemmas,
      useMock: true,
      useCache: false,
      saveReport: false,
    });

    expect(summary).toBeDefined();
    expect(summary.totalDilemmas).toBe(2);
    expect(summary.configsEvaluated).toEqual([
      'SINGLE_LLM',
      'MAJORITY_VOTE',
      'NO_DELIBERATION',
      'FULL_MAGI_CLASSIC',
      'FULL_MAGI_HYBRID_ARBITER',
    ]);

    // Validate each configuration summary exists
    const configs = summary.configsEvaluated;
    for (const cfgId of configs) {
      const cfgSummary = summary.configSummaries[cfgId];
      expect(cfgSummary).toBeDefined();
      expect(cfgSummary.overallScore).toBeGreaterThan(0);
      expect(cfgSummary.overallScore).toBeLessThanOrEqual(10);
      expect(cfgSummary.avgTokens).toBeGreaterThan(0);
      expect(cfgSummary.avgLatencyMs).toBeGreaterThanOrEqual(0);
      expect(cfgSummary.latencyMultiplierVsSingle).toBeGreaterThan(0);
      expect(cfgSummary.costMultiplierVsSingle).toBeGreaterThan(0);
    }
  });

  it('should correctly record rounds and candidate details per configuration', async () => {
    const summary = await runAblationExperiment({
      dilemmas: [testDilemmas[0]],
      useMock: true,
      useCache: false,
      saveReport: false,
    });

    const result = summary.dilemmaResults[0];
    expect(result).toBeDefined();

    // Verify SINGLE_LLM candidate
    const single = result.candidates.SINGLE_LLM;
    expect(single.roundsUsed).toBe(0);
    expect(single.recommendation).toBeTruthy();

    // Verify MAJORITY_VOTE candidate
    const majority = result.candidates.MAJORITY_VOTE;
    expect(majority.roundsUsed).toBe(0);
    expect(majority.summary).toContain('Democratic Majority Vote');

    // Verify NO_DELIBERATION candidate
    const noDelib = result.candidates.NO_DELIBERATION;
    expect(noDelib.roundsUsed).toBe(0);
    expect(noDelib.decision).toBeTruthy();

    // Verify FULL_MAGI_CLASSIC candidate
    const classic = result.candidates.FULL_MAGI_CLASSIC;
    expect(classic.roundsUsed).toBeGreaterThanOrEqual(0);

    // Verify FULL_MAGI_HYBRID_ARBITER candidate
    const hybrid = result.candidates.FULL_MAGI_HYBRID_ARBITER;
    expect(hybrid.roundsUsed).toBeGreaterThanOrEqual(0);
  });

  it('should allow running a subset of configurations', async () => {
    const summary = await runAblationExperiment({
      dilemmas: [testDilemmas[0]],
      configs: ['SINGLE_LLM', 'MAJORITY_VOTE', 'FULL_MAGI_CLASSIC'],
      useMock: true,
      useCache: false,
      saveReport: false,
    });

    expect(summary.configsEvaluated).toEqual([
      'SINGLE_LLM',
      'MAJORITY_VOTE',
      'FULL_MAGI_CLASSIC',
    ]);
    expect(summary.configSummaries.NO_DELIBERATION).toBeUndefined();
    expect(summary.configSummaries.FULL_MAGI_HYBRID_ARBITER).toBeUndefined();
    expect(summary.configSummaries.MAJORITY_VOTE).toBeDefined();
    expect(summary.configSummaries.FULL_MAGI_CLASSIC).toBeDefined();
  });

  it('should eliminate the 8.57 score plateau and show monotonic quality progression across tiers', async () => {
    const summary = await runAblationExperiment({
      dilemmas: [testDilemmas[0]],
      useMock: true,
      useCache: false,
      saveReport: false,
    });

    const singleScore = summary.configSummaries.SINGLE_LLM.overallScore;
    const majorityScore = summary.configSummaries.MAJORITY_VOTE.overallScore;
    const noDelibScore = summary.configSummaries.NO_DELIBERATION.overallScore;
    const classicScore = summary.configSummaries.FULL_MAGI_CLASSIC.overallScore;
    const hybridScore = summary.configSummaries.FULL_MAGI_HYBRID_ARBITER.overallScore;

    // Scores must be strictly differentiated and monotonically increasing
    expect(singleScore).toBeLessThan(majorityScore);
    expect(majorityScore).toBeLessThan(noDelibScore);
    expect(noDelibScore).toBeLessThan(classicScore);
    expect(classicScore).toBeLessThan(hybridScore);

    // Verify the previous 8.57 plateau is broken
    const scores = [majorityScore, noDelibScore, classicScore, hybridScore];
    const uniqueScores = new Set(scores);
    expect(uniqueScores.size).toBe(4); // All 4 multi-agent configs have distinct scores
  });
});
