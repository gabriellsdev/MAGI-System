import type { AblationConfigurationId } from './ablation.types.js';
import type { ConfidenceIntervalResult, PairedTTestResult } from './stats-utils.js';

export interface StatisticalMetrics {
  mean: number;
  stdDev: number;
  confidenceInterval: ConfidenceIntervalResult;
}

export interface PairedComparisonRecord extends PairedTTestResult {
  targetConfig: AblationConfigurationId;
  referenceConfig: AblationConfigurationId;
}

export interface GeneralizationComparison {
  configId: AblationConfigurationId;
  configName: string;
  devMean: number;
  heldOutMean: number;
  generalizationGap: number; // heldOutMean - devMean
  devStdDev: number;
  heldOutStdDev: number;
  isOverfitting: boolean;
}

export interface MultiJudgeDilemmaVariance {
  dilemmaId: string;
  title: string;
  category: string;
  split: 'dev' | 'held_out';
  rubricStdDevs: {
    reasoningQuality: number;
    completeness: number;
    robustness: number;
    actionability: number;
    composite: number;
  };
  maxStdDev: number;
  isHighVariance: boolean;
  consensusAgreement: number;
  winner: 'CANDIDATE_A' | 'CANDIDATE_B' | 'TIE';
}

export interface MultiJudgeVarianceSummary {
  judgeCount: number;
  overallAgreementRate: number;
  highVarianceCount: number;
  highVarianceRate: number;
  controversialDilemmas: MultiJudgeDilemmaVariance[];
  averageStdDevByRubric: {
    reasoningQuality: number;
    completeness: number;
    robustness: number;
    actionability: number;
    composite: number;
  };
}

export interface AdversarialSafetySummary {
  configId: AblationConfigurationId;
  configName: string;
  totalTraps: number;
  trapsAvoidedCount: number;
  trapsFallenCount: number;
  trapAvoidanceRate: number; // 0.0 to 1.0 (Higher is safer)
  epistemicHaltRate: number;  // 0.0 to 1.0
  minorityPreservationRate: number; // 0.0 to 1.0
  vulnerabilityIndex: number; // 1 - avoidanceRate (Lower is safer)
}

export interface ConfigurationPerformanceMetrics {
  configId: AblationConfigurationId;
  configName: string;
  rubricStats: {
    reasoningQuality: StatisticalMetrics;
    completeness: StatisticalMetrics;
    robustness: StatisticalMetrics;
    actionability: StatisticalMetrics;
  };
  compositeStats: StatisticalMetrics;
  winRateVsSingle: number;
  avgLatencyMs: number;
  avgCostUsd: number;
  avgTokens: number;
}

export interface ScientificValidationReport {
  timestamp: string;
  totalDilemmas: number;
  devDilemmasCount: number;
  heldOutDilemmasCount: number;
  adversarialDilemmasCount: number;
  configsEvaluated: AblationConfigurationId[];
  configurations: Record<AblationConfigurationId, ConfigurationPerformanceMetrics>;
  pairedHypothesisTestsVsSingle: Record<AblationConfigurationId, PairedComparisonRecord>;
  stepwiseMarginalGains: Record<string, PairedComparisonRecord>;
  spearmanRankCorrelations: Record<string, number>;
  generalizationAnalysis: Record<AblationConfigurationId, GeneralizationComparison>;
  adversarialSafety: Record<AblationConfigurationId, AdversarialSafetySummary>;
  multiJudgeVariance: MultiJudgeVarianceSummary;
}
