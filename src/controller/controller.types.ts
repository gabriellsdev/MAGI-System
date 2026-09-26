import type { MagiSynthesisResult } from '../domain/types.js';
import type { InvestigationResult } from '../investigation/investigation.types.js';

export type ProblemComplexity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CATASTROPHIC';
export type ExecutionPath = 'FAST_PATH' | 'STANDARD_TRIAD' | 'DEEP_INVESTIGATION';

export interface ProblemClassification {
  complexity: ProblemComplexity;
  riskLevel: RiskLevel;
  domain: string;
  requiresInvestigation: boolean;
  recommendedPath: ExecutionPath;
  reason: string;
  primaryTradeoffs: string[];
}

export type ExecutionPhase =
  | 'CLASSIFICATION'
  | 'INVESTIGATION'
  | 'TOOL_EXECUTION'
  | 'DELIBERATION'
  | 'CORE_SYNTHESIS'
  | 'DECISION_RECORD';

export interface ExecutionPlanStep {
  stepNumber: number;
  phase: ExecutionPhase;
  action: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'SKIPPED' | 'FAILED';
  durationMs?: number;
}

export interface ControllerExecutionResult {
  problem: string;
  classification: ProblemClassification;
  executionPath: ExecutionPath;
  investigation?: InvestigationResult;
  synthesis?: MagiSynthesisResult;
  fastPathAnswer?: string;
  steps: ExecutionPlanStep[];
  totalDurationMs: number;
  evidenceCount: number;
}
