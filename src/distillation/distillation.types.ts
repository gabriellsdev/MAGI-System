import type {
  AgentId,
  AuditableDecision,
  MagiDecision,
  MagiSynthesisResult,
} from '../domain/types.js';

export interface DeliberationTrajectorySummary {
  round0: Record<AgentId, { stance: string; confidence: number; summary: string; arguments: string[] }>;
  rounds: { roundNumber: number; divergentAgents: AgentId[]; significantDisagreement: boolean }[];
  epistemicAuditScore: number;
}

export interface MagiDatasetEntry {
  id: string;
  problem: string;
  domain: string;
  evidenceContext: string;
  trajectory: DeliberationTrajectorySummary;
  synthesis: {
    finalDecision: MagiDecision;
    coreVerdict: string;
    confidence: number;
    decisiveFactors: string[];
    minorityConcern?: string;
    reversalConditions?: string[];
  };
  auditableDecision?: AuditableDecision;
  actualOutcome?: string;
  outcomeDelta: number;               // 0.0 to 1.0
  outcomeStatus: 'SURVIVED' | 'REVERTED' | 'PENDING';
  qualityScore: number;               // 0.0 to 1.0 (composite training weight)
  metadata?: Record<string, unknown>;
}

export interface SftTrainingSample {
  instruction: string;
  input: string;
  output: string;
  messages?: { role: 'system' | 'user' | 'assistant'; content: string }[];
}

export interface DpoTrainingSample {
  prompt: string;
  chosen: string;
  rejected: string;
  margin?: number;
  domain?: string;
  qualityDelta?: number;
}

export interface ShareGptMessage {
  from: 'system' | 'human' | 'gpt';
  value: string;
}

export interface ShareGptSample {
  id: string;
  conversations: ShareGptMessage[];
}

export interface DatasetFilterCriteria {
  minQualityScore?: number;           // default 0.60
  status?: 'SURVIVED' | 'ALL';        // default 'ALL'
  maxDelta?: number;                  // default 0.50
  domains?: string[];
  includeDpoPairs?: boolean;
}

export interface DatasetSummaryStats {
  totalEntries: number;
  sftSamples: number;
  dpoPairs: number;
  shareGptSamples: number;
  domainDistribution: Record<string, number>;
  averageQualityScore: number;
  averageDelta: number;
  estimatedTokens: number;
}

export interface DatasetExportResult {
  format: 'sft' | 'dpo' | 'sharegpt' | 'raw';
  entryCount: number;
  jsonlContent: string;
  stats: DatasetSummaryStats;
}

export interface DistilledInferenceProfile {
  tokenSavingsPercent: number;        // e.g. 74.5%
  speedupFactor: number;              // e.g. 4.8x
  multiAgentEstimatedTokens: number;
  singlePassTokensUsed: number;
  multiAgentEstimatedDurationMs: number;
  singlePassDurationMs: number;
}

export interface DistilledInferenceResult {
  synthesis: MagiSynthesisResult;
  profile: DistilledInferenceProfile;
  escalationRecommended: boolean;
  escalationReason?: string;
}
