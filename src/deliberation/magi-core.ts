import type { ILanguageModelProvider } from '../providers/provider.interface.js';
import type {
  AgentId,
  AgentStructuredOutput,
  DeliberationRound,
  MagiSynthesisResult,
  MagiExecutionMetadata,
  EpistemicClaim,
  EpistemicAudit,
  OperationalReversalContract,
  AuditableDecision,
  AuditableRisk,
  EvidenceReference,
  AuditableAction,
  EvidenceChallenge,
} from '../domain/types.js';
import type { EvidenceStore } from '../knowledge/evidence-store.js';
import { EvidenceAuditor, globalEvidenceAuditor } from './evidence-auditor.js';
import { MagiSynthesisOutputSchema } from '../domain/schemas.js';
import { getLanguageInstruction } from './language-detector.js';
import { calculateGeminiCost } from '../providers/gemini/gemini.config.js';
import { globalReversalMonitor } from '../monitoring/reversal-monitor.js';
import { globalCalibrationEngine } from '../calibration/calibration-engine.js';

import {
  globalAgentReputationRegistry,
  AgentReputationRegistry,
} from '../memory/agent-reputation-registry.js';

export interface MagiCoreSynthesizeOptions {
  language?: string;
  startTime?: number;
  evidenceStore?: EvidenceStore;
  evidenceAuditor?: EvidenceAuditor;
  domain?: string;
  reputationRegistry?: AgentReputationRegistry;
}

export class MagiCore {
  private provider: ILanguageModelProvider;
  private model?: string;

  constructor(provider: ILanguageModelProvider, model?: string) {
    this.provider = provider;
    this.model = model;
  }

  async synthesize(
    question: string,
    initialAnalysis: Record<AgentId, AgentStructuredOutput>,
    rounds: DeliberationRound[],
    options: MagiCoreSynthesizeOptions = {}
  ): Promise<MagiSynthesisResult> {
    const startTime = options.startTime ?? Date.now();
    const language = options.language || 'English';
    const langInstruction = getLanguageInstruction(language);

    const systemInstruction =
      `You are MAGI CORE, the central synthesis arbiter of the MAGI supercomputer system.\n` +
      `You receive the independent analyses from the three foundational facets of human cognition transcribed from Dr. Naoko Akagi:\n` +
      `- MELCHIOR-1 [The Scientist]: Analytical reasoning, empirical truth, mathematical rigor, and technical feasibility.\n` +
      `- BALTHASAR-2 [The Mother]: Critical reasoning, maternal protection of life, existential risk aversion, and systemic safeguards.\n` +
      `- CASPER-3 [The Woman]: Alternative reasoning, individual autonomy, emotional realism, human desires, and pragmatic lateral compromise.\n\n` +
      `CORE MANDATE (SYNTHESIS OF HUMAN EXISTENTIAL DILEMMAS):\n` +
      `1. DO NOT SIMPLY SELECT THE MAJORITY OPINION. Naive democratic vote counting (2 vs 1) is strictly prohibited.\n` +
      `2. Human existence is defined by contradictions. Your purpose is not to erase dialectic tension, but to synthesize an authoritative decision that weighs truth, survival, and individual human reality.\n` +
      `3. If a minority agent (such as Balthasar) identifies an unmitigated catastrophic failure mode or if Melchior proves an empirical contradiction, that objection holds decisive weight regardless of other votes.\n` +
      `4. Score each agent's argument quality objectively from 1 to 10 (MUST be whole integers from 1 to 10, e.g. 7, 8, 9, NEVER decimals below 1).\n` +
      `5. Perform an EPISTEMIC AUDIT: evaluate facts vs unverified assumptions. Give decisive advantage to empirical facts over unsupported speculation.\n` +
      `6. Deliver an authoritative synthesis that reconciles the Scientist, the Mother, and the Woman into a coherent, humane, and definitive verdict.\n` +
      `7. MINORITY REPORT: Explicitly identify the primary objection or reservation that lost the decision. Detail concrete, measurable REVERSAL CONDITIONS (e.g., metric thresholds, latency spikes, or incident triggers) that would mandate rolling back or halting this decision.\n` +
      `8. DECISION METRICS: Calibrate objective decision-level metrics: decisionConfidence (0.0 to 1.0), dissentStrength (0.0 to 1.0), reversibility (0.0 to 1.0), riskSeverity (0.0 to 1.0), and evidenceQuality (1 to 10, MUST be whole integer from 1 to 10, NEVER decimal below 1).\n\n` +
      langInstruction;

    const roundsSummary = rounds.length === 0
      ? 'No deliberation rounds were required (immediate consensus was achieved in Round 0).'
      : rounds
          .map(r => {
            return `--- DELIBERATION ROUND ${r.roundNumber} ---\n` +
              `Disagreement reason: ${r.disagreementReport.reason}\n` +
              Object.entries(r.agentOutputs)
                .map(([id, out]) => {
                  const critiques = out.critiquesOfPeers?.length
                    ? `\n  Critiques: ${out.critiquesOfPeers.map(c => `[vs ${c.targetAgent}: ${c.rebuttal}]`).join('; ')}`
                    : '';
                  const claims = out.claims?.length
                    ? `\n  Claims: ${out.claims.map(c => `[${c.type}] ${c.statement} (Conf: ${c.confidence})`).join('; ')}`
                    : '';
                  return `* ${id}: Stance=${out.stance}, Conf=${out.confidence}\n  Summary: ${out.summary}${critiques}${claims}`;
                })
                .join('\n');
          })
          .join('\n\n');

    const initialSummary = Object.entries(initialAnalysis)
      .map(([id, out]) => {
        const claims = out.claims?.length
          ? `\n  - Epistemic Claims: ${out.claims.map(c => `[${c.type}] ${c.statement} (Conf: ${c.confidence})`).join('; ')}`
          : '';
        return `* ${id} (Round 0):\n` +
          `  - Stance: ${out.stance} (Confidence: ${out.confidence})\n` +
          `  - Summary: ${out.summary}\n` +
          `  - Key Arguments: ${out.keyArguments.join('; ')}\n` +
          `  - Identified Risks: ${out.identifiedRisks.join('; ')}\n` +
          `  - Recommendation: ${out.recommendedAction}${claims}`;
      })
      .join('\n\n');

    const userPrompt =
      `ORIGINAL QUESTION SUBMITTED TO MAGI:\n"${question}"\n\n` +
      `INITIAL INDEPENDENT ANALYSES (ROUND 0):\n${initialSummary}\n\n` +
      `DELIBERATION TRAJECTORY:\n${roundsSummary}\n\n` +
      `Synthesize the final judgment according to the schema in ${language}.`;

    const response = await this.provider.generateStructured({
      model: this.model,
      systemInstruction,
      messages: [{ role: 'user', content: userPrompt }],
      schema: MagiSynthesisOutputSchema,
      schemaName: 'MagiSynthesisOutput',
      config: { temperature: 0.1 },
    });

    const parsed = response.data;
    const durationMs = Date.now() - startTime;

    // Aggregate tokens across all stages (initial, deliberation rounds, and core synthesis)
    let promptTokens = response.usage?.promptTokens || 0;
    let completionTokens = response.usage?.completionTokens || 0;

    Object.values(initialAnalysis).forEach(out => {
      if (out.tokensUsed) {
        promptTokens += out.tokensUsed.promptTokens || 0;
        completionTokens += out.tokensUsed.completionTokens || 0;
      }
    });

    rounds.forEach(r => {
      Object.values(r.agentOutputs).forEach(out => {
        if (out.tokensUsed) {
          promptTokens += out.tokensUsed.promptTokens || 0;
          completionTokens += out.tokensUsed.completionTokens || 0;
        }
      });
    });

    const totalTokensUsed = promptTokens + completionTokens;
    const resolvedModel = this.model || (this.provider as any).defaultModel || 'gemini-3.1-pro-preview';
    const estimatedCostUsd = calculateGeminiCost(resolvedModel, promptTokens, completionTokens);

    // Compute or fall back epistemic audit across all initial & deliberation claims
    let epistemicAudit: EpistemicAudit | undefined = parsed.epistemicAudit;
    if (!epistemicAudit) {
      const allClaims: { agentId: AgentId; claim: EpistemicClaim }[] = [];
      Object.entries(initialAnalysis).forEach(([id, out]) => {
        out.claims?.forEach(claim => allClaims.push({ agentId: id as AgentId, claim }));
      });
      rounds.forEach(r => {
        Object.entries(r.agentOutputs).forEach(([id, out]) => {
          out.claims?.forEach(claim => allClaims.push({ agentId: id as AgentId, claim }));
        });
      });

      if (allClaims.length > 0) {
        const factCount = allClaims.filter(c => c.claim.type === 'FACT').length;
        const unverifiedAssumptionsCount = allClaims.filter(
          c => c.claim.type === 'ASSUMPTION' || (c.claim.requiresEvidence && c.claim.type !== 'FACT')
        ).length;

        const ratio = factCount / (factCount + unverifiedAssumptionsCount || 1);
        const evidenceConfidenceScore = Math.min(10, Math.max(1, Math.round(ratio * 9 + 1)));

        const agentFactScores: Record<AgentId, number> = { MELCHIOR: 0, BALTHASAR: 0, CASPER: 0 };
        allClaims.forEach(({ agentId, claim }) => {
          if (claim.type === 'FACT') agentFactScores[agentId] += 2;
          if (claim.type === 'INFERENCE') agentFactScores[agentId] += 1;
        });

        let strongestAgent: AgentId = 'MELCHIOR';
        let highestScore = -1;
        (Object.keys(agentFactScores) as AgentId[]).forEach(id => {
          if (agentFactScores[id] > highestScore) {
            highestScore = agentFactScores[id];
            strongestAgent = id;
          }
        });

        epistemicAudit = {
          factCount,
          unverifiedAssumptionsCount,
          evidenceConfidenceScore,
          strongestEvidenceAgent: strongestAgent,
        };
      }
    }

    // Generate unique decision tracking identifier
    const decisionId = `DEC-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Determine minority dissenting agent and construct Minority Report fallback if needed
    let minorityReport = parsed.minorityReport;
    if (!minorityReport) {
      // Find candidate dissenting agent (an agent whose stance differs or voiced primary risk)
      const stances = Object.entries(initialAnalysis).map(([id, out]) => ({ id: id as AgentId, stance: out.stance }));
      const nonApprovers = stances.filter(s => s.stance === 'REJECT' || s.stance === 'CONDITIONAL');
      const dissentingId = nonApprovers.length > 0 ? nonApprovers[0].id : (initialAnalysis.BALTHASAR ? 'BALTHASAR' : undefined);
      const primaryConcern = parsed.dissentingOpinionsNoted?.[0] ||
        (dissentingId && initialAnalysis[dissentingId]?.identifiedRisks?.[0]) ||
        'Unmitigated operational friction and edge-case fragility under stress.';

      minorityReport = {
        decision: parsed.finalDecision,
        supportingFactors: parsed.decisiveFactors.slice(0, 3),
        minorityConcern: primaryConcern,
        reversalConditions: [
          'Failure metrics exceed defined threshold (e.g. error rate > 1.0% or unhandled exceptions cascade).',
          'Production SLA degradation exceeds 15% within the first deployment cycle.',
          'Operational recovery window cannot be guaranteed within the maximum tolerable downtime.'
        ],
        dissentingAgent: dissentingId,
      };
    }

    // Ensure structured operational reversal contracts exist inside minority report
    if (!minorityReport.contracts || minorityReport.contracts.length === 0) {
      minorityReport.contracts = [
        {
          id: `${decisionId}-rc1`,
          metric: 'error_rate_percent',
          operator: '>',
          threshold: 1.0,
          window: '5m',
          action: 'ROLLBACK',
          description: 'Breach if 5xx error rate exceeds 1.0% in initial canary window',
          status: 'ACTIVE',
        },
        {
          id: `${decisionId}-rc2`,
          metric: 'p99_latency_ms',
          operator: '>',
          threshold: 500,
          window: '15m',
          action: 'CIRCUIT_BREAK',
          description: 'Breach if p99 response latency exceeds 500ms under load',
          status: 'ACTIVE',
        },
        {
          id: `${decisionId}-rc3`,
          metric: 'sla_drop_percent',
          operator: '>',
          threshold: 15,
          window: '1h',
          action: 'HUMAN_ESCALATION',
          description: 'Breach if service level agreement drops more than 15%',
          status: 'ACTIVE',
        },
      ];
    }

    // Determine Decision Metrics fallback if needed
    let decisionMetrics = parsed.decisionMetrics;
    if (!decisionMetrics) {
      const balthasarRisks = initialAnalysis.BALTHASAR?.identifiedRisks || [];
      const isReject = parsed.finalDecision === 'REJECTED';
      const isConditional = parsed.finalDecision === 'CONDITIONAL_PASS';
      const hasDissent = (parsed.dissentingOpinionsNoted?.length || 0) > 0;

      const decisionConfidence = isReject ? 0.92 : (isConditional ? 0.82 : 0.88);
      const dissentStrength = hasDissent ? 0.45 : (rounds.length > 0 ? 0.30 : 0.10);
      const reversibility = isReject ? 0.95 : (isConditional ? 0.75 : 0.60);
      const riskSeverity = Math.min(0.95, Math.max(0.20, Number((balthasarRisks.length * 0.2 + 0.25).toFixed(2))));
      const evidenceQuality = epistemicAudit?.evidenceConfidenceScore ?? 8;

      decisionMetrics = {
        decisionConfidence,
        dissentStrength,
        reversibility,
        riskSeverity,
        evidenceQuality,
      };
    }

    // Metacognitive Safety Gate (Epistemic Circuit Breaker)
    // Rule: Refuse autonomous clearance when high dissent, low reversibility (one-way door), and weak evidence converge
    let finalDecision = parsed.finalDecision;
    let coreVerdict = parsed.coreVerdict;
    let decisiveFactors = [...parsed.decisiveFactors];
    let metacognitiveHalt = false;

    const isHighDissent = decisionMetrics.dissentStrength >= 0.60;
    const isLowReversibility = decisionMetrics.reversibility <= 0.40;
    const isFragileEvidence = decisionMetrics.evidenceQuality <= 6.0;
    const isSevereRisk = decisionMetrics.riskSeverity >= 0.70;

    if (isHighDissent && isLowReversibility && (isFragileEvidence || isSevereRisk)) {
      finalDecision = 'EPISTEMIC_HALT';
      metacognitiveHalt = true;
      coreVerdict = `[EPISTEMIC_HALT] AUTONOMOUS CLEARANCE REFUSED. Irreversible one-way door action (Reversibility: ${(decisionMetrics.reversibility * 100).toFixed(0)}%) with critical persistent dissent (${(decisionMetrics.dissentStrength * 100).toFixed(0)}%) under speculative evidence (${decisionMetrics.evidenceQuality.toFixed(1)}/10). Mandating human architectural escalation.`;
      decisiveFactors.unshift('[EPISTEMIC_HALT] Refusal of autonomous execution for high-risk irreversible dilemma.');
      if (minorityReport) {
        minorityReport.decision = 'EPISTEMIC_HALT';
      }
    }

    // Calibrated Balthasar Dampening & Empirical Evidence Gate (V4.4)
    const repRegistry = options.reputationRegistry ?? globalAgentReputationRegistry;
    const balthasarDampener = repRegistry.getFalseAlarmDampener('BALTHASAR', options.domain);
    const balthasarClaims = initialAnalysis.BALTHASAR?.claims || [];
    const balthasarHasEmpiricalFact = balthasarClaims.some(c => c.type === 'FACT');

    // If Balthasar is heavily dampened (FAR > 35%) and his objection is purely speculative without FACT evidence,
    // prevent full rejection paralysis: demote unilateral REJECT to CONDITIONAL_PASS with strict canary rollback contracts
    if (balthasarDampener < 0.85 && !balthasarHasEmpiricalFact && finalDecision === 'REJECTED') {
      const otherStances = [initialAnalysis.MELCHIOR?.stance, initialAnalysis.CASPER?.stance];
      const othersApprove = otherStances.some(s => s === 'APPROVE' || s === 'CONDITIONAL');
      if (othersApprove) {
        finalDecision = 'CONDITIONAL_PASS';
        coreVerdict = `[CALIBRATED PASS] Unilateral veto attenuated (Balthasar False Alarm Dampener: ${balthasarDampener}; no empirical FACT provided). Approved conditionally under strict canary rollback gates.`;
        decisiveFactors.unshift(`[CALIBRATED DAMPENER] Balthasar veto attenuated (${balthasarDampener}) due to historical false alarm rate and absence of demonstrable empirical facts.`);
        if (minorityReport) {
          minorityReport.decision = 'CONDITIONAL_PASS';
        }
      }
    }

    const metadata: MagiExecutionMetadata = {
      timestamp: new Date().toISOString(),
      durationMs,
      model: resolvedModel,
      provider: this.provider.providerId,
      language,
      promptTokens,
      completionTokens,
      totalTokensUsed,
      estimatedCostUsd,
    };

    // Audit challenges if present across deliberation rounds
    const allChallenges: EvidenceChallenge[] = [];
    rounds.forEach(r => {
      if (r.evidenceChallenges) allChallenges.push(...r.evidenceChallenges);
    });

    const auditor = options.evidenceAuditor ?? globalEvidenceAuditor;
    const adherenceReport = options.evidenceStore && allChallenges.length > 0
      ? auditor.auditChallenges(allChallenges, options.evidenceStore)
      : undefined;

    const finalQualityScores = { ...parsed.argumentQualityScore };
    if (adherenceReport) {
      (Object.keys(adherenceReport.agentReports) as AgentId[]).forEach(id => {
        const mod = adherenceReport!.agentReports[id].scoreModifier;
        finalQualityScores[id] = Math.max(1, Math.min(10, Math.round(finalQualityScores[id] + mod)));
      });
    }

    if (options.domain || options.reputationRegistry) {
      const repRegistry = options.reputationRegistry ?? globalAgentReputationRegistry;
      const domain = options.domain || 'GENERAL';
      (Object.keys(finalQualityScores) as AgentId[]).forEach(id => {
        const domainMod = repRegistry.getDomainWeightModifier(id, domain);
        finalQualityScores[id] = Math.max(1, Math.min(10, Math.round(finalQualityScores[id] + domainMod)));
      });
    }

    // Assemble AuditableDecision record
    let auditableDecision: AuditableDecision = parsed.auditableDecision!;
    if (!auditableDecision) {
      const allRisks: AuditableRisk[] = [];
      let riskIdx = 1;
      Object.entries(initialAnalysis).forEach(([id, out]) => {
        out.identifiedRisks.forEach(r => {
          allRisks.push({
            id: `risk-${riskIdx++}`,
            description: r,
            severity: r.toLowerCase().includes('catastroph') || r.toLowerCase().includes('data loss')
              ? 'CATASTROPHIC'
              : (r.toLowerCase().includes('delay') || r.toLowerCase().includes('friction') ? 'MEDIUM' : 'HIGH'),
            mitigation: out.recommendedAction || 'Enforce canary testing and rollback triggers.',
            ownerAgent: id as AgentId,
          });
        });
      });

      const evidenceRefs: EvidenceReference[] = [];
      if (options.evidenceStore) {
        options.evidenceStore.getAll().forEach(ev => {
          evidenceRefs.push({
            evidenceId: ev.id,
            source: ev.source,
            relevance: ev.content.slice(0, 100),
            reliability: ev.reliability,
          });
        });
      }

      const assumptions: EpistemicClaim[] = [];
      Object.values(initialAnalysis).forEach(out => {
        out.claims?.filter(c => c.type === 'ASSUMPTION' || c.requiresEvidence).forEach(c => assumptions.push(c));
      });

      const nextActions: AuditableAction[] = [
        {
          id: 'act-1',
          title: 'Canary Verification with Telemetry Gate',
          phase: 'PRE_ROLLOUT',
          mandatoryValidation: minorityReport.reversalConditions[0] || 'Verify error rate < 1.0%',
        },
        {
          id: 'act-2',
          title: 'Operational Reversal Contract Monitoring',
          phase: 'MONITORING_WINDOW',
          mandatoryValidation: 'Verify zero contract breaches for initial operational cycle',
        },
      ];

      auditableDecision = {
        verdict: coreVerdict,
        confidence: decisionMetrics.decisionConfidence,
        risks: allRisks.slice(0, 6),
        minorityConcern: minorityReport.minorityConcern,
        reversalConditions: minorityReport.reversalConditions,
        evidence: evidenceRefs,
        assumptions: assumptions.slice(0, 6),
        unknowns: allChallenges.filter(c => c.status === 'UNSUPPORTED').map(c => c.question),
        nextActions,
        expectedOutcome: finalDecision === 'REJECTED'
          ? 'Halt execution; preserve current architecture baseline and prevent unmitigated blast radius.'
          : 'Execute staged implementation under canary gating with zero telemetry contract breaches.',
      };
    }

    // Register active operational contracts with the Reversal Monitor
    if (minorityReport.contracts && minorityReport.contracts.length > 0 && finalDecision !== 'EPISTEMIC_HALT') {
      globalReversalMonitor.registerDecisionContracts(decisionId, minorityReport.contracts);
    }

    // Record decision in the confidence calibration engine
    globalCalibrationEngine.recordOutcome({
      decisionId,
      timestamp: metadata.timestamp,
      declaredConfidence: decisionMetrics.decisionConfidence,
      status: finalDecision === 'EPISTEMIC_HALT' ? 'PENDING' : 'SURVIVED',
      metadata: {
        finalDecision,
        question,
        dissentStrength: decisionMetrics.dissentStrength,
        reversibility: decisionMetrics.reversibility,
        riskSeverity: decisionMetrics.riskSeverity,
      },
    });

    return {
      decisionId,
      question,
      finalDecision,
      coreVerdict,
      argumentQualityScore: finalQualityScores,
      decisiveFactors,
      synthesisSummary: parsed.synthesisSummary,
      dissentingOpinionsNoted: parsed.dissentingOpinionsNoted,
      deliberationRoundsCount: rounds.length,
      initialAnalysis,
      rounds,
      epistemicAudit,
      minorityReport,
      decisionMetrics,
      auditableDecision,
      metacognitiveHalt,
      totalTokensUsed,
      estimatedCostUsd,
      metadata,
    };
  }
}
