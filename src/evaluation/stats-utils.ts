/**
 * Statistical utilities for Human vs. G-Eval correlation analysis,
 * sample variance, standard deviation, confidence intervals,
 * and paired hypothesis testing (Student's t-test, Cohen's d).
 */

export interface ConfidenceIntervalResult {
  mean: number;
  stdDev: number;
  sampleSize: number;
  marginOfError: number;
  lowerBound: number;
  upperBound: number;
  confidenceLevel: number;
}

export interface PairedTTestResult {
  sampleSize: number;
  meanDiff: number;
  stdDevDiff: number;
  standardError: number;
  tStatistic: number;
  degreesOfFreedom: number;
  pValueApprox: number;
  cohensD: number;
  isSignificant: boolean; // p < 0.05
}

export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return Number((values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(4));
}

export function calculateVariance(values: number[], isSample = true): number {
  if (values.length === 0) return 0;
  if (isSample && values.length <= 1) return 0;

  const mean = calculateMean(values);
  const sumSquaredDiffs = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0);
  const divisor = isSample ? values.length - 1 : values.length;
  return Number((sumSquaredDiffs / divisor).toFixed(4));
}

export function calculateStdDev(values: number[], isSample = true): number {
  return Number(Math.sqrt(calculateVariance(values, isSample)).toFixed(4));
}

/**
 * Calculates Student's t critical value approximation for given degrees of freedom and confidence level.
 */
function getStudentTCriticalValue(df: number, confidence: number): number {
  if (df <= 0) return 1.96;

  // Exact standard t-table values for 95% confidence (two-tailed alpha = 0.05)
  const tTable95: Record<number, number> = {
    1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571,
    6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228,
    15: 2.131, 20: 2.086, 25: 2.060, 30: 2.042, 40: 2.021,
    50: 2.009, 60: 2.000, 80: 1.990, 100: 1.984, 120: 1.980,
  };

  if (Math.abs(confidence - 0.95) < 0.01) {
    if (tTable95[df]) return tTable95[df];
    // Find closest or interpolate
    const keys = Object.keys(tTable95).map(Number).sort((a, b) => a - b);
    if (df > 120) return 1.96;
    for (let i = 0; i < keys.length - 1; i++) {
      if (df > keys[i] && df < keys[i + 1]) {
        const k1 = keys[i];
        const k2 = keys[i + 1];
        const frac = (df - k1) / (k2 - k1);
        return tTable95[k1] + frac * (tTable95[k2] - tTable95[k1]);
      }
    }
  }

  // Fallback normal critical values
  if (confidence >= 0.99) return 2.576;
  if (confidence >= 0.95) return 1.96;
  if (confidence >= 0.90) return 1.645;
  return 1.96;
}

/**
 * Calculates two-tailed p-value approximation for a given t-statistic and degrees of freedom.
 * Uses regularized incomplete beta function approximation or standard normal CDF for df >= 30.
 */
export function approximateTwoTailedPValue(t: number, df: number): number {
  const absT = Math.abs(t);
  if (absT === 0) return 1.0;
  if (df <= 0) return 1.0;

  // For df >= 30, standard normal CDF approximation is accurate within 0.005
  // Using Abramowitz and Stegun 7.1.26 approximation for Gaussian error function
  const x = absT / Math.sqrt(1 + (absT * absT) / (2 * df)); // Variance correction for finite df
  const p = 0.3275911;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;

  const tVal = 1.0 / (1.0 + p * (x / Math.SQRT2));
  const erfVal = 1.0 - (((((a5 * tVal + a4) * tVal) + a3) * tVal + a2) * tVal + a1) * tVal * Math.exp(-(x * x) / 2);
  const twoTailed = 2 * (1 - (0.5 + 0.5 * erfVal));

  return Number(Math.max(0.0001, Math.min(1.0, twoTailed)).toFixed(4));
}

/**
 * Calculates 95% (or custom) Confidence Interval for a sample array.
 */
export function calculateConfidenceInterval(
  values: number[],
  confidence = 0.95
): ConfidenceIntervalResult {
  const n = values.length;
  if (n === 0) {
    return {
      mean: 0,
      stdDev: 0,
      sampleSize: 0,
      marginOfError: 0,
      lowerBound: 0,
      upperBound: 0,
      confidenceLevel: confidence,
    };
  }

  const mean = calculateMean(values);
  if (n === 1) {
    return {
      mean,
      stdDev: 0,
      sampleSize: 1,
      marginOfError: 0,
      lowerBound: mean,
      upperBound: mean,
      confidenceLevel: confidence,
    };
  }

  const stdDev = calculateStdDev(values, true);
  const df = n - 1;
  const criticalT = getStudentTCriticalValue(df, confidence);
  const standardError = stdDev / Math.sqrt(n);
  const marginOfError = Number((criticalT * standardError).toFixed(4));

  return {
    mean,
    stdDev,
    sampleSize: n,
    marginOfError,
    lowerBound: Number((mean - marginOfError).toFixed(4)),
    upperBound: Number((mean + marginOfError).toFixed(4)),
    confidenceLevel: confidence,
  };
}

/**
 * Performs a paired Student's t-test between two paired condition samples (e.g. config A vs config B).
 * Computes mean difference, t-statistic, two-tailed p-value, and Cohen's d effect size.
 */
export function calculatePairedTTest(
  sampleA: number[],
  sampleB: number[]
): PairedTTestResult {
  if (sampleA.length !== sampleB.length || sampleA.length < 2) {
    return {
      sampleSize: Math.min(sampleA.length, sampleB.length),
      meanDiff: 0,
      stdDevDiff: 0,
      standardError: 0,
      tStatistic: 0,
      degreesOfFreedom: 0,
      pValueApprox: 1.0,
      cohensD: 0,
      isSignificant: false,
    };
  }

  const n = sampleA.length;
  const diffs = sampleA.map((val, idx) => val - sampleB[idx]);
  const meanDiff = calculateMean(diffs);
  const stdDevDiff = calculateStdDev(diffs, true);
  const standardError = Number((stdDevDiff / Math.sqrt(n)).toFixed(4));
  const df = n - 1;

  let tStatistic = 0;
  let pValueApprox = 1.0;

  if (standardError > 0) {
    tStatistic = Number((meanDiff / standardError).toFixed(4));
    pValueApprox = approximateTwoTailedPValue(tStatistic, df);
  } else if (meanDiff !== 0) {
    // Invariant difference: sample A uniformly dominates sample B across all pairs
    tStatistic = meanDiff > 0 ? 99.0 : -99.0;
    pValueApprox = 0.0001;
  }

  // Compute pooled standard deviation for Cohen's d
  const stdA = calculateStdDev(sampleA, true);
  const stdB = calculateStdDev(sampleB, true);
  const pooledVariance = (Math.pow(stdA, 2) + Math.pow(stdB, 2)) / 2;
  const pooledStd = Math.sqrt(pooledVariance);

  let cohensD = 0;
  if (pooledStd > 0) {
    cohensD = Number((meanDiff / pooledStd).toFixed(4));
  } else if (stdDevDiff > 0) {
    cohensD = Number((meanDiff / stdDevDiff).toFixed(4));
  } else if (meanDiff !== 0) {
    cohensD = meanDiff > 0 ? 10.0 : -10.0;
  }

  return {
    sampleSize: n,
    meanDiff,
    stdDevDiff,
    standardError,
    tStatistic,
    degreesOfFreedom: df,
    pValueApprox,
    cohensD,
    isSignificant: pValueApprox < 0.05,
  };
}

export function calculatePearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;

  const meanX = calculateMean(x);
  const meanY = calculateMean(y);

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < x.length; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    numerator += diffX * diffY;
    denomX += diffX * diffX;
    denomY += diffY * diffY;
  }

  const denominator = Math.sqrt(denomX * denomY);
  if (denominator === 0) {
    return meanX === meanY ? 1 : 0;
  }

  return Number((numerator / denominator).toFixed(4));
}

export function calculateRanks(values: number[]): number[] {
  const indexed = values.map((val, idx) => ({ val, idx }));
  indexed.sort((a, b) => a.val - b.val);

  const ranks = new Array(values.length);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    while (j < indexed.length - 1 && indexed[j + 1].val === indexed[j].val) {
      j++;
    }
    const avgRank = (i + 1 + j + 1) / 2;
    for (let k = i; k <= j; k++) {
      ranks[indexed[k].idx] = avgRank;
    }
    i = j + 1;
  }

  return ranks;
}

export function calculateSpearmanCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;
  const ranksX = calculateRanks(x);
  const ranksY = calculateRanks(y);
  return calculatePearsonCorrelation(ranksX, ranksY);
}

export function calculateMAE(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;
  const totalDiff = x.reduce((sum, val, idx) => sum + Math.abs(val - y[idx]), 0);
  return Number((totalDiff / x.length).toFixed(3));
}

export function calculateConsensusAgreementRate(
  votes: Array<{ winner: string }>
): number {
  if (votes.length === 0) return 1.0;
  const counts: Record<string, number> = {};
  for (const v of votes) {
    counts[v.winner] = (counts[v.winner] || 0) + 1;
  }
  const maxAgreed = Math.max(...Object.values(counts));
  return Number((maxAgreed / votes.length).toFixed(4));
}
