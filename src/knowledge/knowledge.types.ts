import type { EpistemicClaim, EpistemicType } from '../domain/types.js';

export type EvidenceType =
  | 'DOCUMENT'
  | 'WEB'
  | 'DATABASE'
  | 'EXPERIMENT'
  | 'HUMAN';

export interface Evidence {
  id: string;
  source: string;
  content: string;
  type: EvidenceType;
  reliability: number; // Normalized float 0.0 to 1.0
  timestamp: Date;
  claims: EpistemicClaim[];
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface EvidenceFilter {
  types?: EvidenceType[];
  minReliability?: number;
  tags?: string[];
  textQuery?: string;
  claimTypes?: EpistemicType[];
}

export interface SourceValidationResult {
  source: string;
  isValid: boolean;
  reliabilityScore: number; // 0.0 to 1.0
  reason: string;
  category: 'OFFICIAL_DOC' | 'DATABASE_OR_EXPERIMENT' | 'VERIFIED_WEB' | 'UNVERIFIED_SOURCE' | 'SUSPECT_SOURCE';
  flags: string[];
}
