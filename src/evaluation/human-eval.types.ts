export interface HumanScorecardItem {
  reasoning: number;
  completeness: number;
  robustness: number;
  actionability: number;
}

export type CandidateLetter = 'A' | 'B' | 'C' | 'D' | 'E';

export type ConfigurationId =
  | 'SINGLE_LLM'
  | 'MAJORITY_VOTE'
  | 'NO_DELIBERATION'
  | 'FULL_MAGI_CLASSIC'
  | 'FULL_MAGI_HYBRID_ARBITER';

export interface UnblindingQuestionMapping {
  questionNumber: number;
  questionId: string;
  questionTitle: string;
  category: string;
  letterToConfig: Record<CandidateLetter, ConfigurationId>;
  configToLetter: Record<ConfigurationId, CandidateLetter>;
  gEvalScores: Record<ConfigurationId, HumanScorecardItem>;
}

export interface UnblindingDataset {
  version: string;
  generatedAt: string;
  totalQuestions: number;
  questions: UnblindingQuestionMapping[];
}

export interface HumanEvaluationRecord {
  evaluatorId?: string;
  evaluatorRole?: string;
  timestamp?: string;
  evaluations: Record<number, Record<CandidateLetter, HumanScorecardItem>>;
}

export interface MetricCorrelation {
  dimension: string;
  pearsonR: number;
  spearmanRho: number;
  mae: number;
  meanHuman: number;
  meanGEval: number;
  isNegativeCorrelation: boolean;
  status: 'ALIGNED' | 'MODERATE' | 'DIVERGENT' | 'INVERTED';
}

export interface CorrelationReport {
  timestamp: string;
  totalPairsEvaluated: number;
  evaluatorsCount: number;
  dimensions: Record<string, MetricCorrelation>;
  overall: {
    pearsonR: number;
    spearmanRho: number;
    mae: number;
    status: string;
  };
  configAverages: Record<ConfigurationId, {
    configName: string;
    humanOverall: number;
    gEvalOverall: number;
    humanRank: number;
    gEvalRank: number;
  }>;
  inversionsDetected: string[];
}
