import type { MagiSynthesisResult } from '../domain/types.js';

export interface SingleModelResponse {
  model: string;
  summary: string;
  pros: string[];
  cons: string[];
  verdict: string;
}

export interface ComparisonDifferential {
  perspectivesCount: {
    single: number;
    magi: number;
  };
  unmitigatedRisksCaughtByMagi: string[];
  alternativeCompromisesIntroduced: string[];
  deliberationRoundsUsed: number;
  epistemicAuditQualityAvg: number;
}

export interface MagiComparisonReport {
  question: string;
  singleBaseline: SingleModelResponse;
  magiResult: MagiSynthesisResult;
  differential: ComparisonDifferential;
}
