import type { DimensionScores } from './evaluation.types.js';
import type { MinorityReport, DecisionMetrics } from '../domain/types.js';

export type AblationConfigurationId =
  | 'SINGLE_LLM'
  | 'MAJORITY_VOTE'
  | 'NO_DELIBERATION'
  | 'FULL_MAGI_CLASSIC'
  | 'FULL_MAGI_HYBRID_ARBITER';

export interface AblationCandidateResult {
  configId: AblationConfigurationId;
  configName: string;
  decision: string;
  recommendation: string;
  summary: string;
  keyArguments: string[];
  identifiedRisks: string[];
  latencyMs: number;
  totalTokens: number;
  estimatedCostUsd: number;
  roundsUsed: number;
  minorityReport?: MinorityReport;
  decisionMetrics?: DecisionMetrics;
}

export interface AblationDilemmaResult {
  dilemmaId: string;
  dilemmaTitle: string;
  category: string;
  candidates: Record<AblationConfigurationId, AblationCandidateResult>;
  scores: Record<AblationConfigurationId, DimensionScores>;
  winnersVsSingle: Record<AblationConfigurationId, 'WIN' | 'LOSS' | 'TIE'>;
}

export interface AblationConfigurationSummary {
  configId: AblationConfigurationId;
  configName: string;
  description: string;
  averageScores: DimensionScores;
  overallScore: number;
  marginalQualityGainVsSingle: number; // % gain over SINGLE_LLM baseline
  marginalQualityGainVsPrior: number;  // % gain over preceding ablation stage
  avgLatencyMs: number;
  avgTokens: number;
  avgCostUsd: number;
  latencyMultiplierVsSingle: number;
  costMultiplierVsSingle: number;
  winRateVsSingle: number;
}

export interface AblationExperimentSummary {
  timestamp: string;
  totalDilemmas: number;
  configsEvaluated: AblationConfigurationId[];
  configSummaries: Record<AblationConfigurationId, AblationConfigurationSummary>;
  dilemmaResults: AblationDilemmaResult[];
}
