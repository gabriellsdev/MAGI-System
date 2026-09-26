import type { Evidence } from '../knowledge/knowledge.types.js';

export interface KnownFact {
  statement: string;
  evidenceId?: string;
  confidence: number; // 0.0 to 1.0
  source?: string;
}

export interface UnknownVariable {
  question: string;
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKING';
  hypothesisToTest?: string;
}

export interface NeededEvidenceRequest {
  id: string;
  targetTool: string;
  actionDescription: string;
  parameters: Record<string, any>;
  priority: 'IMMEDIATE' | 'SECONDARY' | 'OPTIONAL';
  expectedInsight: string;
}

export interface InvestigationHypothesis {
  id: string;
  proposition: string;
  expectedEvidenceType: string;
  status: 'UNTESTED' | 'SUPPORTED' | 'REFUTED';
}

export interface InvestigationPlan {
  id: string;
  problem: string;
  knowns: KnownFact[];
  unknowns: UnknownVariable[];
  neededEvidence: NeededEvidenceRequest[];
  hypotheses: InvestigationHypothesis[];
  status: 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'INSUFFICIENT_DATA';
  summary: string;
}

export interface InvestigationResult {
  plan: InvestigationPlan;
  evidenceGathered: Evidence[];
  durationMs: number;
  readinessForDeliberation: 'READY' | 'PARTIAL' | 'CRITICAL_DATA_MISSING';
  dilemmaBrief: string;
}
