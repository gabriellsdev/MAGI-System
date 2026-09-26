import { describe, it, expect } from 'vitest';
import {
  calculateMean,
  calculatePearsonCorrelation,
  calculateRanks,
  calculateSpearmanCorrelation,
  calculateMAE,
} from '../../src/evaluation/stats-utils.js';

describe('Statistical Utilities for Human Eval Validation', () => {
  it('calculates mean accurately', () => {
    expect(calculateMean([10, 8, 6])).toBe(8);
    expect(calculateMean([])).toBe(0);
  });

  it('calculates perfect positive Pearson correlation', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [2, 4, 6, 8, 10];
    expect(calculatePearsonCorrelation(x, y)).toBe(1);
  });

  it('calculates perfect negative Pearson correlation', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [10, 8, 6, 4, 2];
    expect(calculatePearsonCorrelation(x, y)).toBe(-1);
  });

  it('calculates ranks properly with ties', () => {
    // values: [10, 20, 20, 30] -> sorted order: idx 0 is rank 1, idx 1 and 2 tie for ranks 2 and 3 (avg 2.5), idx 3 is rank 4
    const ranks = calculateRanks([10, 20, 20, 30]);
    expect(ranks).toEqual([1, 2.5, 2.5, 4]);
  });

  it('calculates Spearman rank correlation', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [1, 4, 9, 16, 25]; // monotonic nonlinear
    // Spearman should be 1 because monotonic
    expect(calculateSpearmanCorrelation(x, y)).toBe(1);
  });

  it('calculates MAE correctly', () => {
    const x = [8, 7, 9];
    const y = [7, 7, 10];
    // diffs: |8-7|=1, |7-7|=0, |9-10|=1 -> sum=2 -> mean=0.667
    expect(calculateMAE(x, y)).toBe(0.667);
  });
});
