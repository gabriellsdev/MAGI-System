import { describe, it, expect } from 'vitest';
import {
  calculateVariance,
  calculateStdDev,
  calculateConfidenceInterval,
  calculatePairedTTest,
  calculateConsensusAgreementRate,
  calculateSpearmanCorrelation,
} from '../../src/evaluation/stats-utils.js';

describe('Scientific Statistical Utilities', () => {
  it('calculates sample variance and sample standard deviation correctly', () => {
    // Sample: [2, 4, 4, 4, 5, 5, 7, 9]
    // Mean = 40 / 8 = 5
    // Squared diffs: (2-5)^2=9, 3*(4-5)^2=3, 2*(5-5)^2=0, (7-5)^2=4, (9-5)^2=16 -> sum = 32
    // Sample variance (n-1 = 7) = 32 / 7 = 4.5714
    // Sample std dev = sqrt(4.5714) = 2.1381
    const data = [2, 4, 4, 4, 5, 5, 7, 9];
    expect(calculateVariance(data, true)).toBeCloseTo(4.5714, 3);
    expect(calculateStdDev(data, true)).toBeCloseTo(2.1381, 3);
  });

  it('calculates population variance and std dev when isSample is false', () => {
    // Population variance (n = 8) = 32 / 8 = 4
    // Population std dev = sqrt(4) = 2
    const data = [2, 4, 4, 4, 5, 5, 7, 9];
    expect(calculateVariance(data, false)).toBe(4);
    expect(calculateStdDev(data, false)).toBe(2);
  });

  it('calculates 95% confidence interval correctly', () => {
    const scores = [8.5, 8.7, 8.9, 9.1, 8.8, 9.0, 8.6, 9.2, 8.9, 8.8];
    const ci = calculateConfidenceInterval(scores, 0.95);

    expect(ci.sampleSize).toBe(10);
    expect(ci.mean).toBeCloseTo(8.85, 2);
    expect(ci.stdDev).toBeGreaterThan(0);
    expect(ci.marginOfError).toBeGreaterThan(0);
    expect(ci.lowerBound).toBeLessThan(ci.mean);
    expect(ci.upperBound).toBeGreaterThan(ci.mean);
    expect(ci.upperBound - ci.mean).toBeCloseTo(ci.marginOfError, 2);
  });

  it('handles edge cases for confidence intervals (empty and single value)', () => {
    expect(calculateConfidenceInterval([])).toEqual({
      mean: 0,
      stdDev: 0,
      sampleSize: 0,
      marginOfError: 0,
      lowerBound: 0,
      upperBound: 0,
      confidenceLevel: 0.95,
    });

    const single = calculateConfidenceInterval([8.5]);
    expect(single.mean).toBe(8.5);
    expect(single.sampleSize).toBe(1);
    expect(single.marginOfError).toBe(0);
  });

  it('performs paired Student t-test and detects statistically significant improvements', () => {
    // Baseline vs Deliberation: Deliberation consistently scores higher
    const baseline = [7.0, 7.2, 6.8, 7.1, 7.3, 6.9, 7.0, 7.2, 7.1, 7.0];
    const hybrid = [8.8, 8.9, 8.6, 9.0, 9.1, 8.7, 8.8, 9.0, 8.9, 8.8];

    const result = calculatePairedTTest(hybrid, baseline);
    expect(result.sampleSize).toBe(10);
    expect(result.meanDiff).toBeGreaterThan(1.5);
    expect(result.tStatistic).toBeGreaterThan(10); // Very strong t-statistic
    expect(result.pValueApprox).toBeLessThan(0.01);
    expect(result.isSignificant).toBe(true);
    expect(result.cohensD).toBeGreaterThan(1.5); // Huge effect size
  });

  it('detects lack of statistical significance when distributions overlap heavily', () => {
    const groupA = [8.0, 8.1, 8.0, 8.2, 8.1];
    const groupB = [8.0, 8.0, 8.1, 8.1, 8.0];

    const result = calculatePairedTTest(groupA, groupB);
    expect(result.meanDiff).toBeCloseTo(0.04, 2);
    expect(result.pValueApprox).toBeGreaterThan(0.05);
    expect(result.isSignificant).toBe(false);
  });

  it('calculates consensus agreement rate across multi-judge evaluations', () => {
    const unanimous = [{ winner: 'A' }, { winner: 'A' }, { winner: 'A' }];
    expect(calculateConsensusAgreementRate(unanimous)).toBe(1.0);

    const split = [{ winner: 'A' }, { winner: 'A' }, { winner: 'B' }];
    expect(calculateConsensusAgreementRate(split)).toBeCloseTo(0.6667, 3);
  });
});
