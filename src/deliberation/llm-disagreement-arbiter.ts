import { z } from 'zod';
import type { ILanguageModelProvider } from '../providers/provider.interface.js';
import type { AgentId, AgentStructuredOutput } from '../domain/types.js';
import { getLanguageInstruction } from './language-detector.js';

export const LLMArbiterOutputSchema = z.object({
  isSubstantiveDisagreement: z
    .boolean()
    .describe(
      'True if agents have a genuine, fundamental conflict on premises, risks, or actions; False if differences are merely semantic, minor phrasing, or nuanced agreement'
    ),
  reason: z
    .string()
    .describe('Detailed reasoning explaining why the divergence is substantive or superficial'),
  substantiveTopics: z
    .array(z.string())
    .describe('Core topics or conflict dimensions if substantive, or empty/shared topics if superficial'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Confidence in this arbitrated classification (0.0 to 1.0)'),
});

export type LLMArbiterOutput = z.infer<typeof LLMArbiterOutputSchema>;

export interface LLMDisagreementArbiterOptions {
  model?: string;
  temperature?: number;
}

export class LLMDisagreementArbiter {
  private provider: ILanguageModelProvider;
  private model?: string;
  private temperature: number;

  constructor(provider: ILanguageModelProvider, options: LLMDisagreementArbiterOptions = {}) {
    this.provider = provider;
    this.model = options.model;
    this.temperature = options.temperature ?? 0.1;
  }

  async arbitrate(
    question: string,
    outputs: Record<AgentId, AgentStructuredOutput>,
    language?: string
  ): Promise<LLMArbiterOutput> {
    const langInstruction = language ? `\n\n${getLanguageInstruction(language)}` : '';

    const systemInstruction =
      `You are the MAGI DISAGREEMENT ARBITER (Tier 2 Arbiter).\n` +
      `Your purpose is to evaluate whether detected divergence among the three MAGI persona outputs ` +
      `(MELCHIOR-1, BALTHASAR-2, and CASPER-3) constitutes a SUBSTANTIVE disagreement requiring multi-round ` +
      `deliberation, or merely a SUPERFICIAL divergence (semantic nuance, slight confidence variations, or complementary points of view ` +
      `that fundamentally agree on the path forward).\n\n` +
      `EVALUATION CRITERIA:\n` +
      `- SUPERFICIAL: Two agents say APPROVE and one says CONDITIONAL with easily met criteria; or they recommend the exact same action using different vocabulary; or confidence delta is minor without opposing conclusions.\n` +
      `- SUBSTANTIVE: Direct collision of recommendations (e.g. APPROVE vs REJECT), contradictory risk assessments, fundamentally incompatible engineering/ethical premises, or mutually exclusive alternative paths (e.g. REJECT vs PIVOT with conflicting architectures).\n` +
      `If in doubt, classify as substantive to preserve rigorous debate.` +
      langInstruction;

    const agentSummaries = Object.entries(outputs)
      .map(([id, out]) => {
        const claimsSummary = out.claims && out.claims.length > 0
          ? `\n  - Claims: ${out.claims.map(c => `[${c.type}] ${c.statement}`).join('; ')}`
          : '';
        return `### ${id}\n` +
          `- Stance: ${out.stance} (Confidence: ${out.confidence})\n` +
          `- Summary: ${out.summary}\n` +
          `- Key Arguments: ${out.keyArguments.join('; ')}\n` +
          `- Identified Risks: ${out.identifiedRisks.join('; ')}\n` +
          `- Recommendation: ${out.recommendedAction}${claimsSummary}`;
      })
      .join('\n\n');

    const userPrompt =
      `DELIBERATION TOPIC / QUESTION:\n"${question}"\n\n` +
      `CURRENT AGENT EVALUATIONS:\n${agentSummaries}\n\n` +
      `Classify whether this disagreement is SUBSTANTIVE or SUPERFICIAL according to the schema.`;

    try {
      const response = await this.provider.generateStructured({
        model: this.model,
        systemInstruction,
        messages: [{ role: 'user', content: userPrompt }],
        schema: LLMArbiterOutputSchema,
        schemaName: 'LLMArbiterOutput',
        config: { temperature: this.temperature },
      });

      return response.data;
    } catch (err) {
      // Graceful fallback: fail-safe to substantive disagreement so deliberation is not incorrectly skipped
      return {
        isSubstantiveDisagreement: true,
        reason: `Arbiter evaluation encountered an error, falling back to substantive deliberation: ${err instanceof Error ? err.message : String(err)}`,
        substantiveTopics: ['general-divergence'],
        confidence: 0.5,
      };
    }
  }
}
