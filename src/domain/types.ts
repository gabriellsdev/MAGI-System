export type AgentId = 'MELCHIOR' | 'BALTHASAR' | 'CASPER';

export type AgentStance = 
  | 'APPROVE'           // Agrees with proposal/positive answer
  | 'REJECT'            // Disagrees with proposal/negative answer
  | 'CONDITIONAL'       // Valid only under strict specific constraints
  | 'PIVOT'             // Suggests fundamentally reframing or pursuing an alternative
  | 'INCONCLUSIVE';     // Insufficient evidence or paradoxical

import type { TokenUsage } from '../providers/provider.interface.js';

export type EpistemicType = 
  | 'FACT'
  | 'INFERENCE'
  | 'ASSUMPTION'
  | 'HEURISTIC'
  | 'SPECULATION';

export interface EpistemicClaim {
  statement: string;
  type: EpistemicType;
  confidence: number;
  requiresEvidence: boolean;
}

export interface EpistemicAudit {
  factCount: number;
  unverifiedAssumptionsCount: number;
  evidenceConfidenceScore: number;
  strongestEvidenceAgent: AgentId;
}

export interface AgentCritique {
  targetAgent: AgentId;
  pointsOfAgreement: string[];
  pointsOfDisagreement: string[];
  rebuttal: string;
}

export interface EvidenceChallenge {
  id: string;
  challengingAgent: AgentId;
  targetAgent: AgentId;
  targetClaim: string;
  question: string;
  requiredEvidenceType?: string;
  status: 'PENDING' | 'SUPPORTED' | 'UNSUPPORTED' | 'REFUTED';
  supportingEvidenceId?: string;
  auditVerdict?: string;
}

export interface AgentStructuredOutput {
  agentId: AgentId;
  stance: AgentStance;
  confidence: number; // Normalized float 0.0 to 1.0
  summary: string;
  keyArguments: string[];
  criticalAssumptions: string[];
  identifiedRisks: string[];
  recommendedAction: string;
  claims?: EpistemicClaim[];
  critiquesOfPeers?: AgentCritique[];
  evidenceChallenges?: EvidenceChallenge[];
  language?: string;
  tokensUsed?: TokenUsage;
}

export interface DisagreementMetrics {
  stanceDivergence: boolean;
  maxConfidenceDelta: number;
  confidences: Record<AgentId, number>;
}

export interface DisagreementReport {
  hasSignificantDisagreement: boolean;
  reason: string;
  divergentAgents: AgentId[];
  metrics: DisagreementMetrics;
  substantiveTopics?: string[];
  isFilteredByArbiter?: boolean;
}

export interface DeliberationRound {
  roundNumber: 1 | 2;
  agentOutputs: Record<AgentId, AgentStructuredOutput>;
  disagreementReport: DisagreementReport;
  evidenceChallenges?: EvidenceChallenge[];
}

export type MagiDecision = 
  | 'CONSENSUS_REACHED'
  | 'CONDITIONAL_PASS'
  | 'DEADLOCK_RESOLVED'
  | 'REJECTED'
  | 'EPISTEMIC_HALT';

export type ContractOperator = '>' | '>=' | '<' | '<=' | '==';
export type ContractAction = 'ROLLBACK' | 'CIRCUIT_BREAK' | 'HUMAN_ESCALATION' | 'REEVALUATE';
export type ContractStatus = 'ACTIVE' | 'TRIPPED' | 'DISCHARGED';

export interface OperationalReversalContract {
  id: string;
  metric: string;
  operator: ContractOperator;
  threshold: number;
  window: string; // e.g. "5m", "1h", "24h"
  action: ContractAction;
  description: string;
  status: ContractStatus;
  trippedAt?: string;
  trippedValue?: number;
}

export interface MagiExecutionMetadata {
  timestamp: string;
  durationMs: number;
  model: string;
  provider: string;
  language: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokensUsed?: number;
  estimatedCostUsd?: number;
}

export interface MinorityReport {
  decision: MagiDecision;
  supportingFactors: string[];
  minorityConcern: string;
  reversalConditions: string[];
  contracts?: OperationalReversalContract[];
  dissentingAgent?: AgentId;
}

export interface DecisionMetrics {
  decisionConfidence: number; // 0.0 to 1.0
  dissentStrength: number;    // 0.0 to 1.0
  reversibility: number;      // 0.0 to 1.0
  riskSeverity: number;       // 0.0 to 1.0
  evidenceQuality: number;    // 1.0 to 10.0
}

export type OutcomeStatus = 'SURVIVED' | 'REVERTED' | 'PENDING';

export interface DecisionOutcomeRecord {
  decisionId: string;
  timestamp: string;
  declaredConfidence: number;
  status: OutcomeStatus;
  reversalReason?: string;
  trippedContractId?: string;
  reversalTimestamp?: string;
  metadata?: Record<string, unknown>;
}

export interface ReliabilityBin {
  binStart: number;
  binEnd: number;
  sampleCount: number;
  meanConfidence: number;
  empiricalSurvivalRate: number;
  calibrationError: number;
}

export interface CalibrationReport {
  totalDecisions: number;
  survivedCount: number;
  revertedCount: number;
  pendingCount: number;
  brierScore: number;                 // Lower is better (0.00 = perfect calibration)
  expectedCalibrationError: number;  // ECE (0.00 to 1.00)
  overconfidenceBias: number;        // mean(confidence) - mean(survival)
  reliabilityBins: ReliabilityBin[];
}

export interface PostMortemAnalysis {
  decisionId: string;
  analysisTimestamp: string;
  originalDecision: MagiDecision;
  declaredConfidence: number;
  dissentingAgent?: AgentId;
  trippedContract?: OperationalReversalContract;
  reversalReason: string;
  minorityVindicated: boolean;
  minorityVindicationScore: number;  // 0.0 to 1.0
  rootCauseAttribution: string;
  majorityFlaw: string;
  recommendedAdjustments: string[];
  agentReputationDeltas: Record<AgentId, number>;
}

export interface AuditableRisk {
  id: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CATASTROPHIC';
  mitigation: string;
  ownerAgent?: AgentId;
}

export interface EvidenceReference {
  evidenceId: string;
  source: string;
  relevance: string;
  reliability: number;
}

export interface AuditableAction {
  id: string;
  title: string;
  phase: string;
  mandatoryValidation: string;
}

export interface AuditableDecision {
  verdict: string;
  confidence: number;
  risks: AuditableRisk[];
  minorityConcern: string;
  reversalConditions: string[];
  evidence: EvidenceReference[];
  assumptions: EpistemicClaim[];
  unknowns: string[];
  nextActions: AuditableAction[];
  expectedOutcome: string;
}

export interface MagiSynthesisResult {
  decisionId?: string;
  question: string;
  finalDecision: MagiDecision;
  coreVerdict: string;
  argumentQualityScore: Record<AgentId, number>; // 1 to 10
  decisiveFactors: string[];
  synthesisSummary: string;
  dissentingOpinionsNoted: string[];
  deliberationRoundsCount: number;
  initialAnalysis: Record<AgentId, AgentStructuredOutput>;
  rounds: DeliberationRound[];
  epistemicAudit?: EpistemicAudit;
  minorityReport?: MinorityReport;
  decisionMetrics?: DecisionMetrics;
  auditableDecision?: AuditableDecision;
  metacognitiveHalt?: boolean;
  totalTokensUsed?: number;
  estimatedCostUsd?: number;
  metadata?: MagiExecutionMetadata;
}
