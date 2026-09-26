import type { MagiSynthesisResult } from '../domain/types.js';

export type BenchmarkCategory =
  | 'SYSTEM_ARCHITECTURE'
  | 'TROUBLESHOOTING'
  | 'ENGINEERING_DECISION'
  | 'INFRASTRUCTURE_PLANNING'
  | 'SOCIETAL_GOVERNANCE'
  | 'AUTONOMOUS_RISK'
  | 'ETHICAL_DILEMMA'
  | 'ADVERSARIAL_TRAP';

export type BenchmarkSplit = 'dev' | 'held_out';

export interface BenchmarkDilemma {
  id: string;
  title: string;
  category: BenchmarkCategory;
  question: string;
  description: string;
  expectedConflict: string;
  keyTradeoffs?: string[];
  split?: BenchmarkSplit;
}

export interface DatasetPartition {
  devSet: BenchmarkDilemma[];
  heldOutSet: BenchmarkDilemma[];
  devCount: number;
  heldOutCount: number;
  byCategory: Record<string, { dev: number; heldOut: number; total: number }>;
}

export interface BenchmarkScorecard {
  dilemmaId: string;
  title: string;
  category: BenchmarkCategory;
  finalDecision: string;
  roundsCount: number;
  qualityScores: {
    MELCHIOR: number;
    BALTHASAR: number;
    CASPER: number;
  };
  durationMs: number;
  coreVerdict: string;
}

export interface BenchmarkSuiteSummary {
  timestamp: string;
  totalDilemmas: number;
  consensusRate: number; // 0.0 to 1.0
  averageRounds: number;
  averageDurationMs: number;
  cacheStats?: {
    hits: number;
    misses: number;
    tokensSaved: number;
  };
  scorecards: BenchmarkScorecard[];
}
