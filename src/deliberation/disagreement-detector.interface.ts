import type { AgentId, AgentStructuredOutput, DisagreementReport } from '../domain/types.js';

export interface IDisagreementDetector {
  /**
   * Evaluate whether significant disagreement exists between the agents' outputs.
   */
  evaluate(
    outputs: Record<AgentId, AgentStructuredOutput>,
    question?: string
  ): DisagreementReport | Promise<DisagreementReport>;
}
