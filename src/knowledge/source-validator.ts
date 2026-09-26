import type { EvidenceType, SourceValidationResult } from './knowledge.types.js';

export class SourceValidator {
  /**
   * Evaluates the provenance and validity of an evidence source.
   */
  public validate(source: string, type: EvidenceType, content?: string): SourceValidationResult {
    const trimmed = (source || '').trim();
    const flags: string[] = [];

    if (!trimmed) {
      return {
        source,
        isValid: false,
        reliabilityScore: 0.1,
        reason: 'Empty or undefined source provenance.',
        category: 'SUSPECT_SOURCE',
        flags: ['EMPTY_SOURCE'],
      };
    }

    if (content && content.length < 5) {
      flags.push('TRIVIAL_CONTENT');
    }

    const lower = trimmed.toLowerCase();

    // 1. DATABASE or EXPERIMENT (High determinism & empirical grounding)
    if (type === 'DATABASE' || type === 'EXPERIMENT') {
      const isInternalTelemetry = lower.includes('pg_stat') || lower.includes('metrics') || lower.includes('telemetry') || lower.includes('benchmark');
      const score = isInternalTelemetry ? 0.98 : 0.92;
      return {
        source: trimmed,
        isValid: true,
        reliabilityScore: score,
        reason: `Empirical observation from verified ${type.toLowerCase()} execution.`,
        category: 'DATABASE_OR_EXPERIMENT',
        flags,
      };
    }

    // 2. DOCUMENT (Internal RFCs, architectural docs, codebase inspections)
    if (type === 'DOCUMENT') {
      const isOfficialDoc =
        lower.endsWith('.md') ||
        lower.endsWith('.json') ||
        lower.includes('rfc') ||
        lower.includes('spec') ||
        lower.includes('architecture') ||
        lower.includes('docs/');

      const score = isOfficialDoc ? 0.95 : 0.85;
      return {
        source: trimmed,
        isValid: true,
        reliabilityScore: score,
        reason: isOfficialDoc
          ? 'Structured architectural specification or formal documentation.'
          : 'Local or referenced documentation file.',
        category: 'OFFICIAL_DOC',
        flags,
      };
    }

    // 3. HUMAN input / interviews
    if (type === 'HUMAN') {
      return {
        source: trimmed,
        isValid: true,
        reliabilityScore: 0.70,
        reason: 'Direct human operator or stakeholder input (subject to subjective bias).',
        category: 'UNVERIFIED_SOURCE',
        flags: [...flags, 'SUBJECTIVE_PROVENANCE'],
      };
    }

    // 4. WEB sources
    if (type === 'WEB') {
      const isAuthoritativeDomain =
        lower.includes('.gov') ||
        lower.includes('.edu') ||
        lower.includes('ietf.org') ||
        lower.includes('w3.org') ||
        lower.includes('kubernetes.io') ||
        lower.includes('postgresql.org') ||
        lower.includes('mongodb.com') ||
        lower.includes('github.com') ||
        lower.includes('developer.');

      const isSocialOrForum =
        lower.includes('reddit.com') ||
        lower.includes('medium.com') ||
        lower.includes('twitter.com') ||
        lower.includes('x.com') ||
        lower.includes('forum');

      if (isAuthoritativeDomain) {
        return {
          source: trimmed,
          isValid: true,
          reliabilityScore: 0.88,
          reason: 'Authoritative technical domain or vendor official documentation.',
          category: 'VERIFIED_WEB',
          flags,
        };
      }

      if (isSocialOrForum) {
        flags.push('ANECDOTAL_SOURCE');
        return {
          source: trimmed,
          isValid: true,
          reliabilityScore: 0.50,
          reason: 'Public forum or community post containing subjective user anecdotes.',
          category: 'UNVERIFIED_SOURCE',
          flags,
        };
      }

      return {
        source: trimmed,
        isValid: true,
        reliabilityScore: 0.75,
        reason: 'Standard external web reference.',
        category: 'VERIFIED_WEB',
        flags,
      };
    }

    return {
      source: trimmed,
      isValid: true,
      reliabilityScore: 0.60,
      reason: 'Generic source with unclassified provenance.',
      category: 'UNVERIFIED_SOURCE',
      flags,
    };
  }
}

export const globalSourceValidator = new SourceValidator();
