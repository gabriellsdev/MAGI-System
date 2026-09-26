import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { AgentId, AgentStance } from './types.js';

export const AgentIdSchema = z.enum(['MELCHIOR', 'BALTHASAR', 'CASPER']) as z.ZodType<AgentId>;

export const AgentStanceSchema = z.enum([
  'APPROVE',
  'REJECT',
  'CONDITIONAL',
  'PIVOT',
  'INCONCLUSIVE',
]) as z.ZodType<AgentStance>;

export const EpistemicTypeSchema = z.enum([
  'FACT',
  'INFERENCE',
  'ASSUMPTION',
  'HEURISTIC',
  'SPECULATION',
]);

export const EpistemicClaimSchema = z.object({
  statement: z.string().describe('The core assertion or argument statement'),
  type: EpistemicTypeSchema.describe('Epistemic classification: FACT, INFERENCE, ASSUMPTION, HEURISTIC, or SPECULATION'),
  confidence: z.number().min(0).max(1).describe('Confidence level in this specific claim between 0.0 and 1.0'),
  requiresEvidence: z.boolean().describe('True if this claim relies on unverified empirical conditions'),
});

/**
 * Creates a schema for scores on a 1-10 scale.
 * Automatically coerces and scales normalized decimals (e.g. 0.8 -> 8),
 * clamps out-of-range numbers, and safely parses numeric strings.
 * Fresh instances avoid unwanted $ref generation in OpenAPI / JSON schemas.
 */
export function createScore1To10Schema(): z.ZodType<number> {
  return z.preprocess((val) => {
    if (typeof val === 'number' && !isNaN(val)) {
      if (val > 0 && val <= 1) return Math.round(val * 10);
      return Math.max(1, Math.min(10, Math.round(val * 10) / 10));
    }
    if (typeof val === 'string') {
      const num = parseFloat(val.trim());
      if (!isNaN(num)) {
        if (num > 0 && num <= 1) return Math.round(num * 10);
        return Math.max(1, Math.min(10, Math.round(num * 10) / 10));
      }
    }
    return 7;
  }, z.number().min(1).max(10)) as z.ZodType<number>;
}

export const Score1To10Schema = createScore1To10Schema();

export const EpistemicAuditSchema = z.object({
  factCount: z.number().describe('Number of empirically grounded facts cited across proposals'),
  unverifiedAssumptionsCount: z.number().describe('Number of unverified assumptions flagged'),
  evidenceConfidenceScore: createScore1To10Schema().describe('Overall evidentiary rigor score (1-10)'),
  strongestEvidenceAgent: AgentIdSchema.describe('The agent whose argumentation demonstrated highest empirical rigor'),
});

export const AgentCritiqueSchema = z.object({
  targetAgent: AgentIdSchema,
  pointsOfAgreement: z.array(z.string()).describe('Specific points from the peer that you agree with'),
  pointsOfDisagreement: z.array(z.string()).describe('Specific premises or conclusions that you refute'),
  rebuttal: z.string().describe('Detailed logical rebuttal or counter-evidence'),
});

export const EvidenceChallengeSchema = z.object({
  id: z.string().describe('Unique identifier for this challenge'),
  challengingAgent: AgentIdSchema.describe('Agent issuing the challenge'),
  targetAgent: AgentIdSchema.describe('Agent whose claim is being challenged'),
  targetClaim: z.string().describe('The specific claim or assertion being challenged'),
  question: z.string().describe('The exact question or request for proof (e.g. What empirical evidence supports this?)'),
  requiredEvidenceType: z.string().optional().describe('Expected evidence type (e.g. DATABASE, DOCUMENT, WEB, EXPERIMENT)'),
  status: z.enum(['PENDING', 'SUPPORTED', 'UNSUPPORTED', 'REFUTED']).describe('Resolution status of the challenge'),
  supportingEvidenceId: z.string().optional().describe('ID of evidence in Knowledge Layer if supported'),
  auditVerdict: z.string().optional().describe('Brief auditor verdict on whether the claim holds empirical backing'),
});

export const AgentStructuredOutputSchema = z.object({
  agentId: AgentIdSchema,
  stance: AgentStanceSchema.describe('Your final categorical stance on the subject'),
  confidence: z.number().min(0).max(1).describe('Confidence level in this stance between 0.0 and 1.0'),
  summary: z.string().describe('Concise executive summary of your reasoning'),
  keyArguments: z.array(z.string()).min(1).describe('List of foundational arguments supporting your stance'),
  criticalAssumptions: z.array(z.string()).describe('Underlying assumptions your reasoning depends on'),
  identifiedRisks: z.array(z.string()).describe('Potential failure modes, risks, or edge cases'),
  recommendedAction: z.string().describe('Concrete recommendation or path forward'),
  claims: z.array(EpistemicClaimSchema).optional().describe('Structured claims categorized by epistemic typology'),
  critiquesOfPeers: z.array(AgentCritiqueSchema).optional().describe('Critiques directed at peers during deliberation rounds'),
  evidenceChallenges: z.array(EvidenceChallengeSchema).optional().describe('Formal evidence challenges issued against peer claims'),
});

export const MagiDecisionSchema = z.enum([
  'CONSENSUS_REACHED',
  'CONDITIONAL_PASS',
  'DEADLOCK_RESOLVED',
  'REJECTED',
  'EPISTEMIC_HALT',
]);

export const ContractOperatorSchema = z.enum(['>', '>=', '<', '<=', '==']);
export const ContractActionSchema = z.enum(['ROLLBACK', 'CIRCUIT_BREAK', 'HUMAN_ESCALATION', 'REEVALUATE']);
export const ContractStatusSchema = z.enum(['ACTIVE', 'TRIPPED', 'DISCHARGED']);

export const OperationalReversalContractSchema = z.object({
  id: z.string().describe('Unique contract identifier (e.g. rc-1)'),
  metric: z.string().describe('Observable telemetry metric key (e.g. error_rate_percent, p99_latency_ms)'),
  operator: ContractOperatorSchema.describe('Comparison operator (> , >=, <, <=, ==)'),
  threshold: z.number().describe('Numerical boundary threshold that trips the contract'),
  window: z.string().describe('Telemetry evaluation time window (e.g. 5m, 1h, 24h)'),
  action: ContractActionSchema.describe('Autonomous response action if threshold is breached'),
  description: z.string().describe('Human-readable rationale and trigger description'),
  status: ContractStatusSchema.describe('Current lifecycle status of the contract'),
  trippedAt: z.string().optional().describe('ISO timestamp when contract was breached'),
  trippedValue: z.number().optional().describe('Observed value that triggered the breach'),
});

export const MinorityReportSchema = z.object({
  decision: MagiDecisionSchema.describe('Categorical judgment adopted by MAGI Core'),
  supportingFactors: z.array(z.string()).describe('Primary factors supporting the winning verdict'),
  minorityConcern: z.string().describe('The primary critical objection, reservation, or warning from the minority dissent'),
  reversalConditions: z.array(z.string()).min(1).describe('Concrete, observable metric thresholds or events that mandate reversing or halting this decision'),
  contracts: z.array(OperationalReversalContractSchema).optional().describe('Structured operational reversal contracts for automated telemetry monitoring'),
  dissentingAgent: AgentIdSchema.optional().describe('Persona that voiced the primary minority dissent'),
});

export const DecisionMetricsSchema = z.object({
  decisionConfidence: z.number().min(0).max(1).describe('Calibrated confidence in the final decision (0.0 to 1.0)'),
  dissentStrength: z.number().min(0).max(1).describe('Magnitude and persistence of minority dissent (0.0 to 1.0)'),
  reversibility: z.number().min(0).max(1).describe('Ease and safety of reversing this decision in production if failure conditions emerge (0.0 to 1.0)'),
  riskSeverity: z.number().min(0).max(1).describe('Worst-case catastrophic blast radius if critical assumptions fail (0.0 to 1.0)'),
  evidenceQuality: createScore1To10Schema().describe('Empirical evidentiary grounding score (1 to 10 based on verified facts vs speculation)'),
});

export const AuditableRiskSchema = z.object({
  id: z.string().describe('Unique risk identifier'),
  description: z.string().describe('Identified failure mode or risk description'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CATASTROPHIC']).describe('Risk severity assessment'),
  mitigation: z.string().describe('Recommended mitigation strategy or architectural safeguard'),
  ownerAgent: AgentIdSchema.optional().describe('Agent primarily responsible for highlighting this risk'),
});

export const EvidenceReferenceSchema = z.object({
  evidenceId: z.string().describe('ID of evidence in Knowledge Layer'),
  source: z.string().describe('Source URL or provenance identifier'),
  relevance: z.string().describe('Direct relevance to the synthesized decision'),
  reliability: z.number().min(0).max(1).describe('Source reliability score'),
});

export const AuditableActionSchema = z.object({
  id: z.string().describe('Action identifier'),
  title: z.string().describe('Action item title'),
  phase: z.string().describe('Execution phase (e.g. PRE_MIGRATION, CANARY, GA)'),
  mandatoryValidation: z.string().describe('Empirical test or telemetry check required before proceeding'),
});

export const AuditableDecisionSchema = z.object({
  verdict: z.string().describe('Authoritative judgment statement'),
  confidence: z.number().min(0).max(1).describe('Calibrated confidence in the verdict'),
  risks: z.array(AuditableRiskSchema).describe('Structured catalog of identified operational and systemic risks'),
  minorityConcern: z.string().describe('Primary minority reservation preserved in record'),
  reversalConditions: z.array(z.string()).describe('Mandatory operational conditions that mandate rolling back the decision'),
  evidence: z.array(EvidenceReferenceSchema).describe('Empirical evidence items grounding this verdict'),
  assumptions: z.array(EpistemicClaimSchema).describe('Epistemic claims and assumptions underlying the verdict'),
  unknowns: z.array(z.string()).describe('Unresolved variables or uncertainties flagged during investigation'),
  nextActions: z.array(AuditableActionSchema).describe('Mandatory next execution steps'),
  expectedOutcome: z.string().describe('Measurable expected outcome or performance target for post-decision outcome tracking'),
});

export const MagiSynthesisOutputSchema = z.object({
  finalDecision: MagiDecisionSchema.describe('Categorical judgment determined by MAGI Core'),
  coreVerdict: z.string().describe('One-sentence authoritative verdict'),
  argumentQualityScore: z.object({
    MELCHIOR: createScore1To10Schema().describe('Analytical soundness score (1-10)'),
    BALTHASAR: createScore1To10Schema().describe('Critical rigor score (1-10)'),
    CASPER: createScore1To10Schema().describe('Pragmatic viability score (1-10)'),
  }),
  decisiveFactors: z.array(z.string()).min(1).describe('Key evidence or arguments that decided the outcome'),
  synthesisSummary: z.string().describe('Comprehensive synthesis balancing logic, risks, and alternatives'),
  dissentingOpinionsNoted: z.array(z.string()).describe('Key minority concerns preserved in the final record'),
  epistemicAudit: EpistemicAuditSchema.optional().describe('Audit evaluating the strength of facts vs unverified assumptions'),
  minorityReport: MinorityReportSchema.optional().describe('Structured preservation of minority objection and operational reversal conditions'),
  decisionMetrics: DecisionMetricsSchema.optional().describe('Calibrated decision-level risk, reversibility, confidence, and dissent strength metrics'),
  auditableDecision: AuditableDecisionSchema.optional().describe('Full auditable decision record with evidence, risks, reversal conditions, and expected outcomes'),
});

/**
 * Helper to convert Zod schema to an OpenAPI / JSON Schema definition
 * suitable for LLM providers (including Gemini's responseSchema).
 */
export function getProviderJsonSchema(schema: z.ZodTypeAny, schemaName: string): Record<string, unknown> {
  const jsonSchema = zodToJsonSchema(schema, {
    name: schemaName,
    $refStrategy: 'none',
  });
  // If wrapped in definitions, return the inner schema
  if (jsonSchema.definitions && jsonSchema.definitions[schemaName]) {
    return jsonSchema.definitions[schemaName] as Record<string, unknown>;
  }
  return jsonSchema as Record<string, unknown>;
}
