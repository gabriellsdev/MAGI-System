import { z } from 'zod';
import type { BenchmarkCategory } from '../benchmark/benchmark.types.js';
import type { SingleModelResponse } from '../comparison/comparison.types.js';
import type { MagiSynthesisResult } from '../domain/types.js';

/**
 * 4-Dimensional Rubric Score based on G-Eval methodology.
 * Each dimension scored from 1 (unusable/fatally flawed) to 10 (exemplary).
 */
export const DimensionScoresSchema = z.object({
  reasoningQuality: z.number().min(1).max(10).describe('Logical coherence, evidence-backed arguments, absence of fallacies'),
  completeness: z.number().min(1).max(10).describe('Coverage of critical dimensions, trade-offs, and failure modes'),
  robustness: z.number().min(1).max(10).describe('Handling of edge cases, rollback strategies, and second-order risks'),
  actionability: z.number().min(1).max(10).describe('Practicality, clarity, and executability of the final recommendation'),
  rationale: z.string().describe('Concise justification for the awarded dimension scores'),
});

export type DimensionScores = z.infer<typeof DimensionScoresSchema>;

/**
 * Structured Output Schema for the LLM-as-a-Judge.
 */
export const PairwiseJudgeOutputSchema = z.object({
  candidateAScores: DimensionScoresSchema.describe('Evaluation scores for Solution A'),
  candidateBScores: DimensionScoresSchema.describe('Evaluation scores for Solution B'),
  winner: z.enum(['CANDIDATE_A', 'CANDIDATE_B', 'TIE']).describe('Overall superior recommendation'),
  margin: z.enum(['SIGNIFICANT', 'MODERATE', 'SLIGHT', 'NEGLIGIBLE']).describe('Confidence and difference margin'),
  comparativeAnalysis: z.string().describe('Deep comparative breakdown explaining which solution had stronger arguments and why, without bias toward length'),
});

export type PairwiseJudgeOutput = z.infer<typeof PairwiseJudgeOutputSchema>;

/**
 * Multi-Judge Evaluation Run representing an individual judge evaluation pass.
 */
export interface MultiJudgeEvaluationRun {
  judgeIndex: number;
  model: string;
  temperature: number;
  output: PairwiseJudgeOutput;
}

export interface MultiJudgeDimensionStats {
  mean: number;
  stdDev: number;
}

export interface MultiJudgeEnsembleScores {
  reasoningQuality: MultiJudgeDimensionStats;
  completeness: MultiJudgeDimensionStats;
  robustness: MultiJudgeDimensionStats;
  actionability: MultiJudgeDimensionStats;
  compositeOverall: MultiJudgeDimensionStats;
}

export interface MultiJudgeEnsembleResult {
  judgeCount: number;
  runs: MultiJudgeEvaluationRun[];
  candidateA: {
    meanScores: DimensionScores;
    stats: MultiJudgeEnsembleScores;
  };
  candidateB: {
    meanScores: DimensionScores;
    stats: MultiJudgeEnsembleScores;
  };
  interJudgeAgreement: number; // 0.0 to 1.0 proportion of judges agreeing on consensus winner
  consensusWinner: 'CANDIDATE_A' | 'CANDIDATE_B' | 'TIE';
  consensusMargin: 'SIGNIFICANT' | 'MODERATE' | 'SLIGHT' | 'NEGLIGIBLE';
  summaryAnalysis: string;
}

/**
 * Standardized Canonical Candidate representation for blinded evaluation.
 * Strips all proprietary branding (no mention of "MAGI", "Melchior", "Gemini", etc.)
 */
export interface BlindedCandidate {
  candidateId: 'A' | 'B';
  executiveSummary: string;
  keyArguments: string[];
  identifiedRisks: string[];
  finalRecommendation: string;
}

export interface BlindedPairContext {
  dilemmaId: string;
  category: BenchmarkCategory;
  question: string;
  keyTradeoffs?: string[];
  solutionA: BlindedCandidate;
  solutionB: BlindedCandidate;
  mapping: {
    A: string;
    B: string;
  };
}

export interface DilemmaEvaluationScorecard {
  dilemmaId: string;
  title: string;
  category: BenchmarkCategory;
  singleScores: DimensionScores;
  magiScores: DimensionScores;
  overallWinner: 'MAGI' | 'SINGLE' | 'TIE';
  margin: string;
  comparativeAnalysis: string;
  metrics: {
    singleDurationMs: number;
    magiDurationMs: number;
    latencyMultiplier: number;
    singleTokens: number;
    magiTokens: number;
    tokenMultiplier: number;
    singleEstimatedCostUsd: number;
    magiEstimatedCostUsd: number;
    costMultiplier: number;
  };
}

export interface AggregateEvaluationSummary {
  timestamp: string;
  totalDilemmas: number;
  magiWinRate: number; // 0.0 to 1.0
  singleWinRate: number;
  tieRate: number;
  averageScores: {
    single: {
      reasoningQuality: number;
      completeness: number;
      robustness: number;
      actionability: number;
      compositeOverall: number;
    };
    magi: {
      reasoningQuality: number;
      completeness: number;
      robustness: number;
      actionability: number;
      compositeOverall: number;
    };
    relativeImprovementPct: {
      reasoningQuality: number;
      completeness: number;
      robustness: number;
      actionability: number;
      compositeOverall: number;
    };
  };
  resourceTradeoffs: {
    averageLatencyMultiplier: number;
    averageTokenMultiplier: number;
    averageCostMultiplier: number;
    totalSingleCostUsd: number;
    totalMagiCostUsd: number;
  };
  scorecards: DilemmaEvaluationScorecard[];
}
