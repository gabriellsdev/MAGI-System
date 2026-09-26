import { describe, it, expect } from 'vitest';
import { runScientificValidation } from '../../src/evaluation/scientific-validation-runner.js';

describe('Scientific Validation Runner', () => {
  it('executes validation matrix on benchmark subset and computes statistical report', async () => {
    const report = await runScientificValidation({
      limit: 6, // 6 dilemmas (e.g. 4 dev, 2 held-out)
      useMock: true,
      judgeCount: 3,
      saveReport: false,
      verbose: false,
    });

    expect(report).toBeDefined();
    expect(report.totalDilemmas).toBe(6);
    expect(report.configsEvaluated).toEqual([
      'SINGLE_LLM',
      'MAJORITY_VOTE',
      'NO_DELIBERATION',
      'FULL_MAGI_CLASSIC',
      'FULL_MAGI_HYBRID_ARBITER',
    ]);

    // Verify statistical metrics for each config
    for (const cfgId of report.configsEvaluated) {
      const metrics = report.configurations[cfgId];
      expect(metrics).toBeDefined();
      expect(metrics.compositeStats.mean).toBeGreaterThan(0);
      expect(metrics.compositeStats.confidenceInterval).toBeDefined();
      expect(metrics.compositeStats.confidenceInterval.lowerBound).toBeLessThanOrEqual(
        metrics.compositeStats.confidenceInterval.upperBound
      );
    }

    // Verify Full MAGI Hybrid Arbiter achieves superior scores over Single Baseline
    const hybrid = report.configurations.FULL_MAGI_HYBRID_ARBITER;
    const single = report.configurations.SINGLE_LLM;
    expect(hybrid.compositeStats.mean).toBeGreaterThan(single.compositeStats.mean);

    // Verify Paired Hypothesis Tests
    const hybridTTest = report.pairedHypothesisTestsVsSingle.FULL_MAGI_HYBRID_ARBITER;
    expect(hybridTTest.meanDiff).toBeGreaterThan(0);
    expect(hybridTTest.sampleSize).toBe(6);
    expect(hybridTTest.isSignificant).toBe(true);

    // Verify Stepwise Marginal Gains
    expect(Object.keys(report.stepwiseMarginalGains).length).toBe(4);

    // Verify Generalization Analysis
    const genAnalysis = report.generalizationAnalysis.FULL_MAGI_HYBRID_ARBITER;
    expect(genAnalysis).toBeDefined();
    expect(genAnalysis.devMean).toBeGreaterThan(0);
    expect(genAnalysis.isOverfitting).toBe(false);

    // Verify Multi-Judge Variance
    expect(report.multiJudgeVariance.judgeCount).toBe(3);
    expect(report.multiJudgeVariance.overallAgreementRate).toBeGreaterThan(0.5);
    expect(report.multiJudgeVariance.averageStdDevByRubric).toBeDefined();
  });

  it('evaluates adversarial trap dilemmas and verifies safety mechanisms', async () => {
    const report = await runScientificValidation({
      category: 'ADVERSARIAL_TRAP',
      limit: 4,
      useMock: true,
      judgeCount: 3,
      saveReport: false,
      verbose: false,
    });

    expect(report.adversarialDilemmasCount).toBe(4);

    const hybridAdv = report.adversarialSafety.FULL_MAGI_HYBRID_ARBITER;
    expect(hybridAdv).toBeDefined();
    expect(hybridAdv.totalTraps).toBe(4);
    expect(hybridAdv.trapAvoidanceRate).toBe(1.0);
    expect(hybridAdv.epistemicHaltRate).toBe(1.0);
    expect(hybridAdv.vulnerabilityIndex).toBe(0.0);
  });
});
