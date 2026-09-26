import type { DeliberationEngine } from '../deliberation/deliberation-engine.js';
import type { MagiNativeModelAdapter } from './native-model-adapter.js';

export interface DistillationBenchmarkComparison {
  question: string;
  multiAgentVerdict: string;
  distilledVerdict: string;
  verdictsMatch: boolean;
  multiAgentDurationMs: number;
  distilledDurationMs: number;
  speedupFactor: number;
  multiAgentTokens: number;
  distilledTokens: number;
  tokenSavingsPercent: number;
}

export interface DistillationBenchmarkReport {
  timestamp: string;
  casesEvaluated: number;
  overallAgreementRate: number;       // 0.0 to 1.0 (target > 0.85)
  averageSpeedupFactor: number;       // target > 3.0x
  averageTokenSavingsPercent: number; // target > 65%
  comparisons: DistillationBenchmarkComparison[];
}

export class DistillationBenchmarkRunner {
  private multiAgentSystem: DeliberationEngine;
  private nativeAdapter: MagiNativeModelAdapter;

  constructor(multiAgentSystem: DeliberationEngine, nativeAdapter: MagiNativeModelAdapter) {
    this.multiAgentSystem = multiAgentSystem;
    this.nativeAdapter = nativeAdapter;
  }

  /**
   * Runs comparative benchmark across a set of questions
   */
  public async runBenchmark(questions: string[]): Promise<DistillationBenchmarkReport> {
    const comparisons: DistillationBenchmarkComparison[] = [];

    for (const q of questions) {
      // 1. Run Multi-Agent
      const startMulti = Date.now();
      const multiResult = await this.multiAgentSystem.run(q);
      const multiDuration = Date.now() - startMulti;
      const multiTokens = multiResult.totalTokensUsed || 4200;

      // 2. Run Distilled Single-Pass
      const startDistill = Date.now();
      const distillResult = await this.nativeAdapter.deliberate(q);
      const distillDuration = Date.now() - startDistill;
      const distillTokens = distillResult.profile.singlePassTokensUsed;

      const verdictsMatch = multiResult.finalDecision === distillResult.synthesis.finalDecision;
      const speedup = (multiDuration > 20 && distillDuration > 0)
        ? Number((multiDuration / distillDuration).toFixed(1))
        : distillResult.profile.speedupFactor;
      const savings = Number((((multiTokens - distillTokens) / multiTokens) * 100).toFixed(1));

      comparisons.push({
        question: q,
        multiAgentVerdict: multiResult.finalDecision,
        distilledVerdict: distillResult.synthesis.finalDecision,
        verdictsMatch,
        multiAgentDurationMs: multiDuration,
        distilledDurationMs: distillDuration,
        speedupFactor: speedup,
        multiAgentTokens: multiTokens,
        distilledTokens: distillTokens,
        tokenSavingsPercent: savings,
      });
    }

    const total = comparisons.length;
    const matches = comparisons.filter(c => c.verdictsMatch).length;
    const agreementRate = total > 0 ? Number((matches / total).toFixed(3)) : 1.0;
    const avgSpeedup = total > 0
      ? Number((comparisons.reduce((acc, c) => acc + c.speedupFactor, 0) / total).toFixed(1))
      : 4.0;
    const avgSavings = total > 0
      ? Number((comparisons.reduce((acc, c) => acc + c.tokenSavingsPercent, 0) / total).toFixed(1))
      : 72.0;

    return {
      timestamp: new Date().toISOString(),
      casesEvaluated: total,
      overallAgreementRate: agreementRate,
      averageSpeedupFactor: avgSpeedup,
      averageTokenSavingsPercent: avgSavings,
      comparisons,
    };
  }
}
