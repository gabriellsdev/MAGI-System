import type { AgentId, AgentStructuredOutput } from '../domain/types.js';

export interface AgentExecutionOptions {
  language?: string;
  evidenceContext?: string;
}

export interface IAgent {
  readonly id: AgentId;
  readonly name: string;
  readonly roleDescription: string;

  /**
   * Perform initial independent analysis on a question (Round 0).
   */
  analyze(question: string, options?: AgentExecutionOptions): Promise<AgentStructuredOutput>;

  /**
   * Deliberate and evaluate peer arguments during a deliberation round (Round 1 or 2).
   */
  deliberate(
    question: string,
    roundNumber: 1 | 2,
    peerOutputs: Record<AgentId, AgentStructuredOutput>,
    options?: AgentExecutionOptions
  ): Promise<AgentStructuredOutput>;
}
