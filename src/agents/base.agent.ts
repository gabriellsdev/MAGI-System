import type { IAgent, AgentExecutionOptions } from './agent.interface.js';
import type { AgentId, AgentStructuredOutput } from '../domain/types.js';
import type { ILanguageModelProvider } from '../providers/provider.interface.js';
import { AgentStructuredOutputSchema } from '../domain/schemas.js';
import { getLanguageInstruction } from '../deliberation/language-detector.js';

export interface AgentConfig {
  id: AgentId;
  name: string;
  roleDescription: string;
  personaPrompt: string;
  temperature?: number;
  model?: string;
}

export abstract class BaseAgent implements IAgent {
  public readonly id: AgentId;
  public readonly name: string;
  public readonly roleDescription: string;
  protected personaPrompt: string;
  protected temperature: number;
  protected model?: string;
  protected provider: ILanguageModelProvider;

  constructor(config: AgentConfig, provider: ILanguageModelProvider) {
    this.id = config.id;
    this.name = config.name;
    this.roleDescription = config.roleDescription;
    this.personaPrompt = config.personaPrompt;
    this.temperature = config.temperature ?? 0.2;
    this.model = config.model;
    this.provider = provider;
  }

  async analyze(question: string, options: AgentExecutionOptions = {}): Promise<AgentStructuredOutput> {
    const langInstruction = options.language ? `\n\n${getLanguageInstruction(options.language)}` : '';

    const systemInstruction = `${this.personaPrompt}\n\n` +
      `You are ${this.name} (${this.id}), operating as one of the three independent MAGI supercomputers.\n` +
      `Perform a thorough, independent initial analysis. Do not assume or defer to other agents.` +
      langInstruction;

    const userPrompt = `QUESTION FOR MAGI:\n"${question}"\n\n` +
      `Provide your independent assessment according to your analytical archetype.\n` +
      `Be sharp, concise, and direct: limit summary to 1-2 focused sentences and arguments to essential bullet points. Avoid unnecessary filler.\n` +
      `You must output a structured assessment adhering to the schema, including your stance, confidence (0.0 to 1.0), summary, keyArguments, criticalAssumptions, identifiedRisks, recommendedAction, and claims.\n` +
      `For claims, classify your primary assertions by epistemic type (FACT, INFERENCE, ASSUMPTION, HEURISTIC, or SPECULATION), including your confidence and whether empirical evidence is required.`;

    const response = await this.provider.generateStructured({
      model: this.model,
      systemInstruction,
      messages: [{ role: 'user', content: userPrompt }],
      schema: AgentStructuredOutputSchema,
      schemaName: 'AgentStructuredOutput',
      config: { temperature: this.temperature },
    });

    return {
      ...response.data,
      agentId: this.id,
      language: options.language,
      tokensUsed: response.usage,
    };
  }

  async deliberate(
    question: string,
    roundNumber: 1 | 2,
    peerOutputs: Record<AgentId, AgentStructuredOutput>,
    options: AgentExecutionOptions = {}
  ): Promise<AgentStructuredOutput> {
    const langInstruction = options.language ? `\n\n${getLanguageInstruction(options.language)}` : '';

    const peerSummaries = Object.entries(peerOutputs)
      .filter(([id]) => id !== this.id)
      .map(([id, output]) => {
        const claimsSummary = output.claims && output.claims.length > 0
          ? `\n- Epistemic Claims:\n${output.claims.map(c => `  * [${c.type}] ${c.statement} (Conf: ${c.confidence}, NeedsEvidence: ${c.requiresEvidence})`).join('\n')}`
          : '';
        return `### PEER: ${id}\n` +
          `- Stance: ${output.stance} (Confidence: ${output.confidence})\n` +
          `- Summary: ${output.summary}\n` +
          `- Key Arguments:\n${output.keyArguments.map(arg => `  * ${arg}`).join('\n')}\n` +
          `- Identified Risks:\n${output.identifiedRisks.map(risk => `  * ${risk}`).join('\n')}\n` +
          `- Recommendation: ${output.recommendedAction}${claimsSummary}`;
      })
      .join('\n\n');

    const ownPrevious = peerOutputs[this.id];

    const systemInstruction = `${this.personaPrompt}\n\n` +
      `You are ${this.name} (${this.id}), participating in DELIBERATION ROUND ${roundNumber}.\n` +
      `Examine your peers' stances, premises, epistemic claims, and counterarguments with intellectual honesty.\n` +
      `If a peer raised a point that exposes a flaw or unverified assumption in your previous stance, you are expected to update or qualify your stance.\n` +
      `If their arguments are flawed, provide a rigorous critique.` +
      langInstruction;

    const userPrompt = `ORIGINAL QUESTION:\n"${question}"\n\n` +
      `YOUR PREVIOUS STANCE:\n` +
      `- Stance: ${ownPrevious?.stance} (Confidence: ${ownPrevious?.confidence})\n` +
      `- Summary: ${ownPrevious?.summary}\n\n` +
      `PEER ASSESSMENTS:\n` +
      `${peerSummaries}\n\n` +
      (options.evidenceContext ? `VERIFIED EMPIRICAL EVIDENCE BASE (KNOWLEDGE LAYER):\n${options.evidenceContext}\n\n` : '') +
      `DELIBERATION INSTRUCTIONS:\n` +
      `1. Directly evaluate the arguments, claims, and risks presented by your peers.\n` +
      `2. Include explicit critiquesOfPeers for the peers you disagree or agree with.\n` +
      `3. Provide categorized claims (FACT, INFERENCE, ASSUMPTION, HEURISTIC, SPECULATION) for your key points.\n` +
      `4. EVIDENCE CHALLENGE: If a peer makes an assertion that lacks verified grounding in the Knowledge Layer or makes an unverified assumption, formulate formal evidenceChallenges asking "What empirical evidence supports this assertion?".\n` +
      `5. State your updated stance (APPROVE, REJECT, CONDITIONAL, PIVOT, or INCONCLUSIVE), confidence, revised key arguments, and updated recommendation.\n` +
      `6. Be concise and incisive: keep rebuttals and summaries focused in 1-2 sharp sentences. Avoid repetitive rambling.`;

    const response = await this.provider.generateStructured({
      model: this.model,
      systemInstruction,
      messages: [{ role: 'user', content: userPrompt }],
      schema: AgentStructuredOutputSchema,
      schemaName: 'AgentStructuredOutput',
      config: { temperature: this.temperature },
    });

    return {
      ...response.data,
      agentId: this.id,
      language: options.language,
      tokensUsed: response.usage,
    };
  }
}
