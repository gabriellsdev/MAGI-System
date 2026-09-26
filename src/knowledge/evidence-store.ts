import type { Evidence, EvidenceFilter } from './knowledge.types.js';
import type { EpistemicClaim } from '../domain/types.js';
import { SourceValidator, globalSourceValidator } from './source-validator.js';

export class EvidenceStore {
  private items: Map<string, Evidence> = new Map();
  private validator: SourceValidator;

  constructor(validator: SourceValidator = globalSourceValidator) {
    this.validator = validator;
  }

  /**
   * Adds or updates a single verified evidence entry.
   */
  public addEvidence(evidence: Evidence): Evidence {
    const validation = this.validator.validate(evidence.source, evidence.type, evidence.content);
    
    // Calibrate reliability score against validator if not explicitly pinned
    const calibratedReliability = Math.min(
      1.0,
      Math.max(0.0, evidence.reliability !== undefined ? evidence.reliability : validation.reliabilityScore)
    );

    const validatedEntry: Evidence = {
      ...evidence,
      reliability: calibratedReliability,
      timestamp: evidence.timestamp || new Date(),
      metadata: {
        ...evidence.metadata,
        validationCategory: validation.category,
        validationFlags: validation.flags,
      },
    };

    this.items.set(validatedEntry.id, validatedEntry);
    return validatedEntry;
  }

  /**
   * Adds multiple evidence entries in batch.
   */
  public addMany(evidences: Evidence[]): Evidence[] {
    return evidences.map(e => this.addEvidence(e));
  }

  /**
   * Retrieves an evidence entry by its unique ID.
   */
  public getById(id: string): Evidence | undefined {
    return this.items.get(id);
  }

  /**
   * Retrieves all evidence entries currently stored.
   */
  public getAll(): Evidence[] {
    return Array.from(this.items.values());
  }

  /**
   * Filters evidence items according to specified criteria.
   */
  public find(filter?: EvidenceFilter): Evidence[] {
    if (!filter) return this.getAll();

    return this.getAll().filter(item => {
      if (filter.types && filter.types.length > 0 && !filter.types.includes(item.type)) {
        return false;
      }

      if (filter.minReliability !== undefined && item.reliability < filter.minReliability) {
        return false;
      }

      if (filter.tags && filter.tags.length > 0) {
        const itemTags = item.tags || [];
        const matchesTag = filter.tags.some(t => itemTags.includes(t));
        if (!matchesTag) return false;
      }

      if (filter.textQuery) {
        const q = filter.textQuery.toLowerCase();
        const contentMatch = item.content.toLowerCase().includes(q);
        const sourceMatch = item.source.toLowerCase().includes(q);
        if (!contentMatch && !sourceMatch) return false;
      }

      if (filter.claimTypes && filter.claimTypes.length > 0) {
        const hasMatchingClaim = item.claims.some(c => filter.claimTypes!.includes(c.type));
        if (!hasMatchingClaim) return false;
      }

      return true;
    });
  }

  /**
   * Calculates the overall average reliability of all stored evidence items.
   */
  public getAverageReliability(): number {
    const all = this.getAll();
    if (all.length === 0) return 0.0;
    const sum = all.reduce((acc, curr) => acc + curr.reliability, 0);
    return Number((sum / all.length).toFixed(3));
  }

  /**
   * Extracts all epistemic claims attached to stored evidence.
   */
  public getAllClaims(): EpistemicClaim[] {
    const claims: EpistemicClaim[] = [];
    this.items.forEach(e => claims.push(...e.claims));
    return claims;
  }

  /**
   * Clears all stored evidence.
   */
  public clear(): void {
    this.items.clear();
  }

  /**
   * Total count of stored evidence items.
   */
  public get count(): number {
    return this.items.size;
  }

  /**
   * Formats stored evidence into an authoritative structured brief for MAGI agents.
   */
  public formatForDeliberation(): string {
    const all = this.getAll();
    if (all.length === 0) {
      return 'NO EXTERNAL EVIDENCE REGISTERED (Agents must rely on intrinsic reasoning and mark assumptions accordingly).';
    }

    const header = `### KNOWLEDGE LAYER EVIDENCE REPOSITORY (${all.length} items, Avg Reliability: ${this.getAverageReliability()})\n`;
    const itemsText = all
      .map((item, idx) => {
        const claimsText = item.claims.length > 0
          ? `\n   - Claims: ${item.claims.map(c => `[${c.type}] "${c.statement}" (Conf: ${c.confidence})`).join('; ')}`
          : '';
        return `${idx + 1}. [EVIDENCE #${item.id}] [${item.type}] Source: "${item.source}" (Reliability: ${item.reliability})\n` +
          `   Content: ${item.content}${claimsText}`;
      })
      .join('\n\n');

    return header + itemsText;
  }
}

export const globalEvidenceStore = new EvidenceStore();
