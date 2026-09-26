import type { AgentId, PostMortemAnalysis } from '../domain/types.js';
import type { AgentReputationProfile, DomainReputationRecord } from './memory.types.js';
import { JsonFileStore } from '../storage/json-storage.js';

export interface AgentReputationOptions {
  storageDir?: string;
  persist?: boolean;
}

export class AgentReputationRegistry {
  private profiles: Map<AgentId, AgentReputationProfile> = new Map();
  private fileStore: JsonFileStore<AgentReputationProfile[]>;

  constructor(empty = false, options: AgentReputationOptions = {}) {
    this.fileStore = new JsonFileStore<AgentReputationProfile[]>('reputation.json', [], {
      storageDir: options.storageDir,
      enabled: options.persist,
    });

    if (!empty) {
      const persisted = this.fileStore.load();
      if (persisted && persisted.length > 0) {
        persisted.forEach(p => this.profiles.set(p.agentId, p));
      } else {
        this.seedDefaultProfiles();
        this.persist();
      }
    } else {
      this.initEmptyProfiles();
      this.persist();
    }
  }

  private persist(): void {
    if (this.fileStore.isEnabled()) {
      this.fileStore.save(Array.from(this.profiles.values()));
    }
  }

  /**
   * Resets all profiles, optionally re-seeding historical baseline
   */
  public reset(empty = false): void {
    this.profiles.clear();
    if (!empty) {
      this.seedDefaultProfiles();
    } else {
      this.initEmptyProfiles();
    }
    this.persist();
  }

  /**
   * Retrieves reputation profile for an agent
   */
  public getReputation(agentId: AgentId): AgentReputationProfile {
    const profile = this.profiles.get(agentId);
    if (!profile) {
      throw new Error(`Reputation profile not found for agent: ${agentId}`);
    }
    return {
      ...profile,
      domainReputations: { ...profile.domainReputations },
    };
  }

  /**
   * Alias for getReputation
   */
  public getProfile(agentId: AgentId): AgentReputationProfile {
    return this.getReputation(agentId);
  }

  /**
   * Returns all agent profiles
   */
  public getAllProfiles(): AgentReputationProfile[] {
    return Array.from(this.profiles.values()).map(p => ({
      ...p,
      domainReputations: { ...p.domainReputations },
    }));
  }

  /**
   * Computes dynamic weight modifier (-1.5 to +1.5) for deliberation argumentQualityScore
   * based on the agent's baseline reputation and domain expertise.
   */
  public getDomainWeightModifier(agentId: AgentId, domain: string): number {
    const profile = this.profiles.get(agentId);
    if (!profile) return 0;

    const normalizedDomain = (domain || 'GENERAL').toUpperCase();
    const domainRecord = profile.domainReputations[normalizedDomain];

    const effectiveScore = domainRecord ? domainRecord.score : profile.baseReputation;
    // Base reference is 7.0. Every 1.0 point above/below 7.0 produces +/-0.5 modifier
    const rawMod = (effectiveScore - 7.0) * 0.5;
    const clamped = Math.max(-1.5, Math.min(1.5, rawMod));

    return Number(clamped.toFixed(1));
  }

  /**
   * Updates agent reputation following an empirical post-mortem autopsy
   */
  public applyPostMortem(postMortem: PostMortemAnalysis, domain = 'GENERAL'): void {
    const normalizedDomain = domain.toUpperCase();
    const dissentingAgent = postMortem.dissentingAgent;

    (Object.keys(postMortem.agentReputationDeltas) as AgentId[]).forEach(id => {
      const profile = this.profiles.get(id);
      if (!profile) return;

      profile.totalDecisionsInvolved++;
      profile.revertedDecisions++;

      const delta = postMortem.agentReputationDeltas[id] || 0;
      profile.baseReputation = Number(
        Math.max(1.0, Math.min(10.0, profile.baseReputation + delta)).toFixed(2)
      );

      // Domain tracking
      if (!profile.domainReputations[normalizedDomain]) {
        profile.domainReputations[normalizedDomain] = {
          domain: normalizedDomain,
          score: 7.0,
          decisionsEvaluated: 0,
          accuracyRate: 0.5,
          vindicationCount: 0,
        };
      }

      const domainRec = profile.domainReputations[normalizedDomain];
      domainRec.decisionsEvaluated++;

      if (id === dissentingAgent && postMortem.minorityVindicated) {
        profile.minorityVindications++;
        domainRec.vindicationCount++;
        domainRec.score = Number(Math.min(10.0, domainRec.score + 0.5).toFixed(2));
        domainRec.accuracyRate = Number(
          ((domainRec.accuracyRate * (domainRec.decisionsEvaluated - 1) + 1.0) / domainRec.decisionsEvaluated).toFixed(3)
        );
      } else {
        domainRec.score = Number(Math.max(1.0, domainRec.score - 0.3).toFixed(2));
        domainRec.accuracyRate = Number(
          ((domainRec.accuracyRate * (domainRec.decisionsEvaluated - 1) + 0.0) / domainRec.decisionsEvaluated).toFixed(3)
        );
      }
    });
    this.persist();
  }

  /**
   * Records successful survival of a decision in production
   */
  public recordSurvival(decisionId: string, domain = 'GENERAL', dissentingAgent?: AgentId): void {
    const normalizedDomain = domain.toUpperCase();

    (['MELCHIOR', 'BALTHASAR', 'CASPER'] as AgentId[]).forEach(id => {
      const profile = this.profiles.get(id);
      if (!profile) return;

      profile.totalDecisionsInvolved++;

      if (id === dissentingAgent) {
        // Minority dissented, but decision survived cleanly -> False alarm
        // Rebalanced penalty: -0.15 on base, -0.25 on domain to counteract perpetual rejection bias
        profile.falseAlarms++;
        profile.baseReputation = Number(Math.max(1.0, profile.baseReputation - 0.15).toFixed(2));

        if (!profile.domainReputations[normalizedDomain]) {
          profile.domainReputations[normalizedDomain] = {
            domain: normalizedDomain,
            score: 7.0,
            decisionsEvaluated: 0,
            accuracyRate: 0.5,
            vindicationCount: 0,
          };
        }
        const domainRec = profile.domainReputations[normalizedDomain];
        domainRec.decisionsEvaluated++;
        domainRec.score = Number(Math.max(1.0, domainRec.score - 0.25).toFixed(2));
        domainRec.accuracyRate = Number(
          ((domainRec.accuracyRate * (domainRec.decisionsEvaluated - 1) + 0.0) / domainRec.decisionsEvaluated).toFixed(3)
        );
      } else {
        // Majority supported and succeeded
        profile.survivedDecisions++;
        profile.baseReputation = Number(Math.min(10.0, profile.baseReputation + 0.05).toFixed(2));

        if (!profile.domainReputations[normalizedDomain]) {
          profile.domainReputations[normalizedDomain] = {
            domain: normalizedDomain,
            score: 7.0,
            decisionsEvaluated: 0,
            accuracyRate: 0.7,
            vindicationCount: 0,
          };
        }

        const domainRec = profile.domainReputations[normalizedDomain];
        domainRec.decisionsEvaluated++;
        domainRec.score = Number(Math.min(10.0, domainRec.score + 0.05).toFixed(2));
        domainRec.accuracyRate = Number(
          ((domainRec.accuracyRate * (domainRec.decisionsEvaluated - 1) + 1.0) / domainRec.decisionsEvaluated).toFixed(3)
        );
      }
    });
    this.persist();
  }

  /**
   * Computes the agent's historical false alarm rate (0.0 to 1.0)
   */
  public getFalseAlarmRate(agentId: AgentId, domain?: string): number {
    const profile = this.profiles.get(agentId);
    if (!profile) return 0;

    const totalAlarms = profile.minorityVindications + profile.falseAlarms;
    if (totalAlarms === 0) return 0;

    return Number((profile.falseAlarms / totalAlarms).toFixed(3));
  }

  /**
   * Computes dampening multiplier (0.40 to 1.0) applied to agent's veto power
   * If an agent has a disproportionate false alarm rate (> 35%), their unilateral veto
   * power is attenuated to prevent analysis paralysis.
   */
  public getFalseAlarmDampener(agentId: AgentId, domain?: string): number {
    const far = this.getFalseAlarmRate(agentId, domain);
    const threshold = 0.35;

    if (far <= threshold) {
      return 1.0;
    }

    // Linearly degrade veto authority from 1.0 down to 0.40 for FAR in [0.35, 1.0]
    const excess = far - threshold;
    const dampener = Math.max(0.40, 1.0 - excess * 1.2);
    return Number(dampener.toFixed(2));
  }

  /**
   * Initializes empty baseline profiles
   */
  private initEmptyProfiles(): void {
    (['MELCHIOR', 'BALTHASAR', 'CASPER'] as AgentId[]).forEach(id => {
      this.profiles.set(id, {
        agentId: id,
        baseReputation: 7.0,
        totalDecisionsInvolved: 0,
        survivedDecisions: 0,
        revertedDecisions: 0,
        minorityVindications: 0,
        falseAlarms: 0,
        domainReputations: {},
      });
    });
  }

  /**
   * Seeds historical reputation profiles reflecting past decisions (e.g. HIST-009, HIST-010)
   */
  private seedDefaultProfiles(): void {
    this.profiles.set('MELCHIOR', {
      agentId: 'MELCHIOR',
      baseReputation: 7.4,
      totalDecisionsInvolved: 21,
      survivedDecisions: 17,
      revertedDecisions: 4,
      minorityVindications: 1,
      falseAlarms: 2,
      domainReputations: {
        ARCHITECTURE: { domain: 'ARCHITECTURE', score: 8.2, decisionsEvaluated: 8, accuracyRate: 0.875, vindicationCount: 1 },
        SCIENTIFIC: { domain: 'SCIENTIFIC', score: 8.4, decisionsEvaluated: 6, accuracyRate: 0.833, vindicationCount: 0 },
        DATABASE: { domain: 'DATABASE', score: 6.6, decisionsEvaluated: 4, accuracyRate: 0.500, vindicationCount: 0 },
        GENERAL: { domain: 'GENERAL', score: 7.4, decisionsEvaluated: 3, accuracyRate: 0.667, vindicationCount: 0 },
      },
    });

    this.profiles.set('BALTHASAR', {
      agentId: 'BALTHASAR',
      baseReputation: 7.9,
      totalDecisionsInvolved: 21,
      survivedDecisions: 16,
      revertedDecisions: 5,
      minorityVindications: 3,
      falseAlarms: 1,
      domainReputations: {
        DATABASE: { domain: 'DATABASE', score: 8.6, decisionsEvaluated: 6, accuracyRate: 0.833, vindicationCount: 2 },
        INFRASTRUCTURE: { domain: 'INFRASTRUCTURE', score: 8.3, decisionsEvaluated: 7, accuracyRate: 0.857, vindicationCount: 1 },
        SECURITY: { domain: 'SECURITY', score: 8.1, decisionsEvaluated: 5, accuracyRate: 0.800, vindicationCount: 0 },
        GENERAL: { domain: 'GENERAL', score: 7.5, decisionsEvaluated: 3, accuracyRate: 0.667, vindicationCount: 0 },
      },
    });

    this.profiles.set('CASPER', {
      agentId: 'CASPER',
      baseReputation: 7.3,
      totalDecisionsInvolved: 21,
      survivedDecisions: 17,
      revertedDecisions: 4,
      minorityVindications: 1,
      falseAlarms: 1,
      domainReputations: {
        OPERATIONS: { domain: 'OPERATIONS', score: 8.1, decisionsEvaluated: 8, accuracyRate: 0.875, vindicationCount: 1 },
        GOVERNANCE: { domain: 'GOVERNANCE', score: 7.8, decisionsEvaluated: 5, accuracyRate: 0.800, vindicationCount: 0 },
        FINANCIAL: { domain: 'FINANCIAL', score: 7.7, decisionsEvaluated: 5, accuracyRate: 0.800, vindicationCount: 0 },
        GENERAL: { domain: 'GENERAL', score: 7.2, decisionsEvaluated: 3, accuracyRate: 0.667, vindicationCount: 0 },
      },
    });
  }
}

export const globalAgentReputationRegistry = new AgentReputationRegistry();
