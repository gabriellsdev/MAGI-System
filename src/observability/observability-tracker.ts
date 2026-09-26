import type {
  MagiSynthesisResult,
  DisagreementReport,
} from '../domain/types.js';

export interface DisagreementObservabilityStats {
  structuralDisagreements: number;
  substantiveDisagreements: number;
  superficialFilteredByArbiter: number;
  arbiterFilterRate: number; // % of structural disagreements filtered out
}

export interface AdaptiveRoutingObservabilityStats {
  fastPathCount: number;
  standardPathCount: number;
  deepDeliberationCount: number;
  estimatedTokensSaved: number;
  estimatedCostSavedUsd: number;
}

export interface MagiSystemMetrics {
  totalQueries: number;
  consensusRate: number;       // % resolved in round 0 (immediate consensus)
  avgRounds: number;
  avgConfidence: number;      // % average confidence of final decisions
  avgLatencyMs: number;
  avgCostUsd: number;
  totalTokensUsed: number;
  disagreementStats: DisagreementObservabilityStats;
  adaptiveRoutingStats: AdaptiveRoutingObservabilityStats;
  lastUpdated: string;
}

export class ObservabilityTracker {
  private totalQueries = 0;
  private immediateConsensusCount = 0;
  private totalRounds = 0;
  private totalLatencyMs = 0;
  private totalCostUsd = 0;
  private totalTokens = 0;
  private confidenceAccum = 0;

  // Disagreement metrics
  private structuralDisagreements = 0;
  private substantiveDisagreements = 0;
  private superficialFiltered = 0;

  // Adaptive routing metrics
  private fastPathCount = 0;
  private standardPathCount = 0;
  private deepDeliberationCount = 0;
  private estimatedTokensSaved = 0;
  private estimatedCostSavedUsd = 0;

  recordExecution(
    result: MagiSynthesisResult,
    adaptivePath?: 'FAST_PATH' | 'STANDARD_TRIAD' | 'DEEP_DELIBERATION',
    savings?: { tokensSaved: number; costSavedUsd: number }
  ): void {
    this.totalQueries += 1;
    this.totalRounds += result.deliberationRoundsCount;
    this.totalLatencyMs += result.metadata?.durationMs || 0;
    this.totalCostUsd += result.estimatedCostUsd || 0;
    this.totalTokens += result.totalTokensUsed || 0;

    if (result.deliberationRoundsCount === 0) {
      this.immediateConsensusCount += 1;
    }

    // Accumulate confidence from initial analysis if present
    if (result.initialAnalysis) {
      const confs = Object.values(result.initialAnalysis).map(o => o.confidence);
      if (confs.length > 0) {
        const avg = confs.reduce((a, b) => a + b, 0) / confs.length;
        this.confidenceAccum += avg;
      }
    } else {
      this.confidenceAccum += 0.85; // Default standard baseline
    }

    // Record rounds disagreement reports
    result.rounds?.forEach(r => {
      if (r.disagreementReport) {
        this.recordDisagreementEvent(r.disagreementReport);
      }
    });

    if (adaptivePath) {
      if (adaptivePath === 'FAST_PATH') this.fastPathCount += 1;
      else if (adaptivePath === 'STANDARD_TRIAD') this.standardPathCount += 1;
      else if (adaptivePath === 'DEEP_DELIBERATION') this.deepDeliberationCount += 1;
    }

    if (savings) {
      this.estimatedTokensSaved += savings.tokensSaved;
      this.estimatedCostSavedUsd += savings.costSavedUsd;
    }
  }

  recordDisagreementEvent(report: DisagreementReport): void {
    this.structuralDisagreements += 1;
    if (report.isFilteredByArbiter) {
      this.superficialFiltered += 1;
    } else if (report.hasSignificantDisagreement) {
      this.substantiveDisagreements += 1;
    }
  }

  getMetrics(): MagiSystemMetrics {
    const total = this.totalQueries || 1;
    const consensusRate = Number(((this.immediateConsensusCount / total) * 100).toFixed(1));
    const avgRounds = Number((this.totalRounds / total).toFixed(2));
    const avgConfidence = Number(((this.confidenceAccum / total) * 100).toFixed(1));
    const avgLatencyMs = Math.round(this.totalLatencyMs / total);
    const avgCostUsd = Number((this.totalCostUsd / total).toFixed(5));

    const structTotal = this.structuralDisagreements || 1;
    const arbiterFilterRate = Number(((this.superficialFiltered / structTotal) * 100).toFixed(1));

    return {
      totalQueries: this.totalQueries,
      consensusRate,
      avgRounds,
      avgConfidence,
      avgLatencyMs,
      avgCostUsd,
      totalTokensUsed: this.totalTokens,
      disagreementStats: {
        structuralDisagreements: this.structuralDisagreements,
        substantiveDisagreements: this.substantiveDisagreements,
        superficialFilteredByArbiter: this.superficialFiltered,
        arbiterFilterRate,
      },
      adaptiveRoutingStats: {
        fastPathCount: this.fastPathCount,
        standardPathCount: this.standardPathCount,
        deepDeliberationCount: this.deepDeliberationCount,
        estimatedTokensSaved: this.estimatedTokensSaved,
        estimatedCostSavedUsd: Number(this.estimatedCostSavedUsd.toFixed(4)),
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  reset(): void {
    this.totalQueries = 0;
    this.immediateConsensusCount = 0;
    this.totalRounds = 0;
    this.totalLatencyMs = 0;
    this.totalCostUsd = 0;
    this.totalTokens = 0;
    this.confidenceAccum = 0;
    this.structuralDisagreements = 0;
    this.substantiveDisagreements = 0;
    this.superficialFiltered = 0;
    this.fastPathCount = 0;
    this.standardPathCount = 0;
    this.deepDeliberationCount = 0;
    this.estimatedTokensSaved = 0;
    this.estimatedCostSavedUsd = 0;
  }
}

// Global default singleton instance for app-wide metrics
export const globalObservabilityTracker = new ObservabilityTracker();
