import type { ConfigurationId, HumanScorecardItem } from './human-eval.types.js';
import { DILEMMAS_BATCH_1 } from './dilemmas-batch1.js';
import { DILEMMAS_BATCH_2 } from './dilemmas-batch2.js';
import { DILEMMAS_BATCH_3 } from './dilemmas-batch3.js';

export interface DilemmaResponsePayload {
  configId: ConfigurationId;
  decision: string;
  executiveSummary: string;
  keyArguments: string[];
  identifiedRisks: string[];
  recommendation: string;
  gEvalScores: HumanScorecardItem;
}

export interface DilemmaEvaluationEntry {
  questionNumber: number;
  id: string;
  title: string;
  category: string;
  context: string;
  keyTradeoffs: string[];
  responses: Record<ConfigurationId, DilemmaResponsePayload>;
}

export const ALL_30_DILEMMAS: DilemmaEvaluationEntry[] = [
  ...DILEMMAS_BATCH_1,
  ...DILEMMAS_BATCH_2,
  ...DILEMMAS_BATCH_3,
];
