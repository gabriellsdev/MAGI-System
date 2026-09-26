import type { AgentId, EvidenceChallenge } from '../domain/types.js';
import type { EvidenceStore } from '../knowledge/evidence-store.js';

export interface AgentAdherenceReport {
  agentId: AgentId;
  challengesReceived: number;
  supportedClaimsCount: number;
  unsupportedClaimsCount: number;
  refutedClaimsCount: number;
  scoreModifier: number; // Penalty/bonus applied to argumentQualityScore (-3.0 to +1.0)
  verdictSummary: string;
}

export interface AuditChallengesResult {
  auditedChallenges: EvidenceChallenge[];
  agentReports: Record<AgentId, AgentAdherenceReport>;
  overallIntegrityScore: number; // 0.0 to 1.0
}

export class EvidenceAuditor {
  /**
   * Audits each evidence challenge against the active Knowledge Layer repository.
   */
  public auditChallenges(
    challenges: EvidenceChallenge[],
    evidenceStore: EvidenceStore
  ): AuditChallengesResult {
    const audited: EvidenceChallenge[] = [];
    const allEvidence = evidenceStore.getAll();

    const reports: Record<AgentId, AgentAdherenceReport> = {
      MELCHIOR: {
        agentId: 'MELCHIOR',
        challengesReceived: 0,
        supportedClaimsCount: 0,
        unsupportedClaimsCount: 0,
        refutedClaimsCount: 0,
        scoreModifier: 0,
        verdictSummary: 'No challenges audited.',
      },
      BALTHASAR: {
        agentId: 'BALTHASAR',
        challengesReceived: 0,
        supportedClaimsCount: 0,
        unsupportedClaimsCount: 0,
        refutedClaimsCount: 0,
        scoreModifier: 0,
        verdictSummary: 'No challenges audited.',
      },
      CASPER: {
        agentId: 'CASPER',
        challengesReceived: 0,
        supportedClaimsCount: 0,
        unsupportedClaimsCount: 0,
        refutedClaimsCount: 0,
        scoreModifier: 0,
        verdictSummary: 'No challenges audited.',
      },
    };

    for (const challenge of challenges) {
      const targetAgent = challenge.targetAgent;
      reports[targetAgent].challengesReceived++;

      const claimLower = challenge.targetClaim.toLowerCase();
      const questionLower = challenge.question.toLowerCase();

      // Search for supporting evidence in store
      let matchingEvidence = allEvidence.find(ev => {
        // Direct claim statement match
        const hasClaimMatch = ev.claims.some(c =>
          claimLower.includes(c.statement.toLowerCase().slice(0, 30)) ||
          c.statement.toLowerCase().includes(claimLower.slice(0, 30))
        );
        if (hasClaimMatch) return true;

        // Content relevance match
        const keywords = claimLower.split(/\s+/).filter(w => w.length > 4);
        const matchCount = keywords.filter(k => ev.content.toLowerCase().includes(k)).length;
        return keywords.length > 0 && matchCount >= Math.min(2, keywords.length);
      });

      // Check if evidence directly refutes or contradicts the claim
      const isContradiction = allEvidence.some(ev => {
        const contentLower = ev.content.toLowerCase();
        if (claimLower.includes('zero downtime') && contentLower.includes('downtime')) return true;
        if (claimLower.includes('full acid') && contentLower.includes('trade strict consistency')) return true;
        return false;
      });

      let status: 'SUPPORTED' | 'UNSUPPORTED' | 'REFUTED' = 'UNSUPPORTED';
      let auditVerdict = 'No empirical evidence found in Knowledge Layer to substantiate this assertion.';
      let supportingEvidenceId: string | undefined;

      if (isContradiction && (!matchingEvidence || matchingEvidence.reliability < 0.8)) {
        status = 'REFUTED';
        auditVerdict = 'Direct empirical contradiction identified in Knowledge Layer telemetry.';
        reports[targetAgent].refutedClaimsCount++;
        reports[targetAgent].scoreModifier -= 2.0;
      } else if (matchingEvidence && matchingEvidence.reliability >= 0.70) {
        status = 'SUPPORTED';
        supportingEvidenceId = matchingEvidence.id;
        auditVerdict = `Corroborated by verified evidence #${matchingEvidence.id} (${matchingEvidence.source}, Reliability: ${matchingEvidence.reliability}).`;
        reports[targetAgent].supportedClaimsCount++;
        reports[targetAgent].scoreModifier += 0.5;
      } else {
        status = 'UNSUPPORTED';
        auditVerdict = 'Assertion lacks verified grounding in Knowledge Layer. Reclassified as speculation.';
        reports[targetAgent].unsupportedClaimsCount++;
        reports[targetAgent].scoreModifier -= 1.0;
      }

      audited.push({
        ...challenge,
        status,
        supportingEvidenceId,
        auditVerdict,
      });
    }

    // Finalize report summaries and normalize score modifiers
    let totalSupported = 0;
    let totalChallenges = audited.length;

    (Object.keys(reports) as AgentId[]).forEach(id => {
      const r = reports[id];
      r.scoreModifier = Math.max(-3.0, Math.min(1.0, Number(r.scoreModifier.toFixed(1))));
      if (r.challengesReceived > 0) {
        totalSupported += r.supportedClaimsCount;
        r.verdictSummary = `${r.challengesReceived} challenges received: ${r.supportedClaimsCount} supported, ${r.unsupportedClaimsCount} unsupported, ${r.refutedClaimsCount} refuted (Modifier: ${r.scoreModifier >= 0 ? '+' : ''}${r.scoreModifier}).`;
      } else {
        r.verdictSummary = 'Zero challenges contested.';
      }
    });

    const overallIntegrityScore = totalChallenges > 0
      ? Number((totalSupported / totalChallenges).toFixed(2))
      : 1.0;

    return {
      auditedChallenges: audited,
      agentReports: reports,
      overallIntegrityScore,
    };
  }
}

export const globalEvidenceAuditor = new EvidenceAuditor();
