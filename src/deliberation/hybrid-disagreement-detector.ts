import type { IDisagreementDetector } from './disagreement-detector.interface.js';
import { RuleBasedDisagreementDetector, type RuleBasedDetectorOptions } from './rule-based-disagreement-detector.js';
import { LLMDisagreementArbiter, type LLMDisagreementArbiterOptions } from './llm-disagreement-arbiter.js';
import type { ILanguageModelProvider } from '../providers/provider.interface.js';
import type { AgentId, AgentStructuredOutput, DisagreementReport } from '../domain/types.js';

export interface HybridDisagreementDetectorConfig {
  provider?: ILanguageModelProvider;
  arbiter?: LLMDisagreementArbiter;
  ruleBasedDetector?: RuleBasedDisagreementDetector;
  ruleBasedOptions?: RuleBasedDetectorOptions;
  arbiterOptions?: LLMDisagreementArbiterOptions;
}

export class HybridDisagreementDetector implements IDisagreementDetector {
  private ruleBasedDetector: RuleBasedDisagreementDetector;
  private arbiter?: LLMDisagreementArbiter;

  constructor(config: HybridDisagreementDetectorConfig = {}) {
    this.ruleBasedDetector =
      config.ruleBasedDetector ?? new RuleBasedDisagreementDetector(config.ruleBasedOptions);

    if (config.arbiter) {
      this.arbiter = config.arbiter;
    } else if (config.provider) {
      this.arbiter = new LLMDisagreementArbiter(config.provider, config.arbiterOptions);
    }
  }

  async evaluate(
    outputs: Record<AgentId, AgentStructuredOutput>,
    question?: string
  ): Promise<DisagreementReport> {
    // Tier 1: Zero-cost structural and statistical divergence check
    const tier1Report = this.ruleBasedDetector.evaluate(outputs);

    // If Tier 1 finds no disagreement, consensus is immediate (0 tokens used)
    if (!tier1Report.hasSignificantDisagreement) {
      return tier1Report;
    }

    // If no Tier 2 arbiter is configured, fall back directly to Tier 1 decision
    if (!this.arbiter) {
      return tier1Report;
    }

    // Tier 2: LLM Arbiter inspects semantic divergence vs superficial phrasing
    const topicQuestion = question || 'General topic evaluation';
    const arbiterVerdict = await this.arbiter.arbitrate(topicQuestion, outputs);

    if (!arbiterVerdict.isSubstantiveDisagreement) {
      return {
        hasSignificantDisagreement: false,
        reason: `Superficial divergence filtered by Arbiter: ${arbiterVerdict.reason}`,
        divergentAgents: tier1Report.divergentAgents,
        metrics: tier1Report.metrics,
        substantiveTopics: arbiterVerdict.substantiveTopics,
        isFilteredByArbiter: true,
      };
    }

    return {
      ...tier1Report,
      hasSignificantDisagreement: true,
      reason: `Substantive disagreement confirmed by Arbiter: ${arbiterVerdict.reason}`,
      substantiveTopics: arbiterVerdict.substantiveTopics,
      isFilteredByArbiter: false,
    };
  }
}
