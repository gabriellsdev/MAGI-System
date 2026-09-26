import type {
  AgentId,
  AuditableDecision,
  MagiDecision,
  MagiSynthesisResult,
  PostMortemAnalysis,
} from '../domain/types.js';

export type DecisionOutcomeStatus = 'PENDING' | 'SURVIVED' | 'REVERTED';

export type MatchClassification = 'ACCURATE' | 'ACCEPTABLE' | 'DEVIATED' | 'FAILED';

export type FailurePattern =
  | 'OVERCONFIDENCE'
  | 'MISSING_EVIDENCE'
  | 'PREMATURE_CONSENSUS'
  | 'INVARIANT_BREACH';

export interface OutcomeDeltaReport {
  rawDelta: number;                   // 0.0 to 1.0
  matchClassification: MatchClassification;
  metricDeltas: Record<string, number>;
  explanation: string;
}

export interface StoredDecision {
  decisionId: string;
  timestamp: string;
  problem: string;
  domain: string;
  verdict: MagiDecision;
  declaredConfidence: number;
  auditableDecision: AuditableDecision;
  synthesisSummary: string;
  status: DecisionOutcomeStatus;
  actualOutcome?: string;
  observedMetrics?: Record<string, number>;
  outcomeDelta?: number;
  matchClassification?: MatchClassification;
  failurePattern?: FailurePattern;
  reversalReason?: string;
  trippedContractId?: string;
  resolvedAt?: string;
  postMortem?: PostMortemAnalysis;
  metadata?: Record<string, unknown>;
}

export interface OutcomeTrackingInput {
  decisionId: string;
  actualOutcome: string;
  observedMetrics?: Record<string, number>;
  status?: 'SURVIVED' | 'REVERTED';
  reversalReason?: string;
  trippedContractId?: string;
  timestamp?: string;
}

export interface OutcomeTrackingResult {
  decisionId: string;
  status: DecisionOutcomeStatus;
  deltaReport: OutcomeDeltaReport;
  failurePattern?: FailurePattern;
  postMortem?: PostMortemAnalysis;
  reputationAdjusted: boolean;
  agentReputationDeltas?: Record<AgentId, number>;
}

export interface DomainReputationRecord {
  domain: string;
  score: number;                      // 1.0 to 10.0
  decisionsEvaluated: number;
  accuracyRate: number;               // 0.0 to 1.0
  vindicationCount: number;
}

export interface AgentReputationProfile {
  agentId: AgentId;
  baseReputation: number;             // 1.0 to 10.0 (default 7.0)
  totalDecisionsInvolved: number;
  survivedDecisions: number;
  revertedDecisions: number;
  minorityVindications: number;
  falseAlarms: number;
  domainReputations: Record<string, DomainReputationRecord>;
}

export interface MemoryQueryFilter {
  domain?: string;
  status?: DecisionOutcomeStatus;
  minConfidence?: number;
  maxDelta?: number;
  searchQuery?: string;
}

export interface MemorySummaryStats {
  totalDecisions: number;
  pendingCount: number;
  survivedCount: number;
  revertedCount: number;
  survivalRate: number;
  averageConfidence: number;
  averageDelta: number;
  domainsRepresented: string[];
}
