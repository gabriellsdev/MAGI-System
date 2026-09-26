import { describe, it, expect, vi } from 'vitest';
import { HybridDisagreementDetector } from '../../src/deliberation/hybrid-disagreement-detector.js';
import { LLMDisagreementArbiter } from '../../src/deliberation/llm-disagreement-arbiter.js';
import { MockLanguageModelProvider } from '../../src/providers/mock/mock.provider.js';
import type { AgentStructuredOutput } from '../../src/domain/types.js';

describe('V3 Stage 3: Two-Tier LLM Disagreement Arbiter', () => {
  const baseOutputs: Record<'MELCHIOR' | 'BALTHASAR' | 'CASPER', AgentStructuredOutput> = {
    MELCHIOR: {
      agentId: 'MELCHIOR',
      stance: 'APPROVE',
      confidence: 0.85,
      summary: 'Approve migration to async workers.',
      keyArguments: ['Decouples ingestion from processing'],
      criticalAssumptions: [],
      identifiedRisks: [],
      recommendedAction: 'Adopt BullMQ',
    },
    BALTHASAR: {
      agentId: 'BALTHASAR',
      stance: 'APPROVE',
      confidence: 0.82,
      summary: 'Approve with dead-letter queue monitoring.',
      keyArguments: ['Risk of message loss is contained'],
      criticalAssumptions: [],
      identifiedRisks: ['Queue backlog if consumer hangs'],
      recommendedAction: 'Adopt BullMQ with alert thresholds',
    },
    CASPER: {
      agentId: 'CASPER',
      stance: 'APPROVE',
      confidence: 0.84,
      summary: 'Pragmatic adoption of BullMQ.',
      keyArguments: ['Mature library, minimal ops overhead'],
      criticalAssumptions: [],
      identifiedRisks: [],
      recommendedAction: 'Adopt BullMQ',
    },
  };

  it('Tier 1: should bypass LLM Arbiter when RuleBased detector detects zero disagreement', async () => {
    const mockProvider = new MockLanguageModelProvider();
    const arbitrateSpy = vi.spyOn(mockProvider, 'generateStructured');

    const detector = new HybridDisagreementDetector({ provider: mockProvider });
    const report = await detector.evaluate(baseOutputs, 'Should we migrate to async queues?');

    expect(report.hasSignificantDisagreement).toBe(false);
    expect(report.isFilteredByArbiter).toBeUndefined();
    // Tier 2 arbiter was NOT called because Tier 1 found complete agreement
    expect(arbitrateSpy).not.toHaveBeenCalled();
  });

  it('Tier 2: should filter superficial disagreement when stances/confidences diverge slightly but path forward aligns', async () => {
    // Casper has CONDITIONAL stance, causing Tier 1 rule-based detector to flag divergence
    const divergentOutputs: Record<'MELCHIOR' | 'BALTHASAR' | 'CASPER', AgentStructuredOutput> = {
      ...baseOutputs,
      CASPER: {
        ...baseOutputs.CASPER,
        stance: 'CONDITIONAL',
        confidence: 0.79,
        summary: 'Approve conditionally provided Redis memory is monitored.',
      },
    };

    const mockProvider = new MockLanguageModelProvider();
    mockProvider.onGenerate(() => ({
      isSubstantiveDisagreement: false,
      reason: 'All agents recommend adopting BullMQ; Casper simply adds standard operational monitoring.',
      substantiveTopics: ['bullmq-adoption'],
      confidence: 0.95,
    }));

    const detector = new HybridDisagreementDetector({ provider: mockProvider });
    const report = await detector.evaluate(divergentOutputs, 'Should we migrate to async queues?');

    // Filtered by Tier 2 arbiter!
    expect(report.hasSignificantDisagreement).toBe(false);
    expect(report.isFilteredByArbiter).toBe(true);
    expect(report.reason).toContain('Superficial divergence filtered by Arbiter');
    expect(report.substantiveTopics).toContain('bullmq-adoption');
  });

  it('Tier 2: should confirm substantive disagreement when irreconcilable conflict exists', async () => {
    // Balthasar strongly REJECTS while Melchior APPROVES
    const conflictingOutputs: Record<'MELCHIOR' | 'BALTHASAR' | 'CASPER', AgentStructuredOutput> = {
      ...baseOutputs,
      BALTHASAR: {
        agentId: 'BALTHASAR',
        stance: 'REJECT',
        confidence: 0.95,
        summary: 'Reject: async workers will cause out-of-order execution corrupting financial ledgers.',
        keyArguments: ['Strict serial consistency required by accounting regulations'],
        criticalAssumptions: ['Database cannot handle transactional distributed locks'],
        identifiedRisks: ['Ledger corruption, non-recoverable regulatory breach'],
        recommendedAction: 'Do not use async queue; keep synchronous 2-phase commit',
      },
    };

    const mockProvider = new MockLanguageModelProvider();
    mockProvider.onGenerate(() => ({
      isSubstantiveDisagreement: true,
      reason: 'Irreconcilable conflict: Melchior proposes asynchronous queues while Balthasar proves regulatory requirement for synchronous transaction ordering.',
      substantiveTopics: ['financial-consistency', 'concurrency-model'],
      confidence: 0.98,
    }));

    const detector = new HybridDisagreementDetector({ provider: mockProvider });
    const report = await detector.evaluate(conflictingOutputs, 'Should we migrate payment processing to async queues?');

    // Confirmed as substantive disagreement by Tier 2 arbiter
    expect(report.hasSignificantDisagreement).toBe(true);
    expect(report.isFilteredByArbiter).toBe(false);
    expect(report.reason).toContain('Substantive disagreement confirmed by Arbiter');
    expect(report.substantiveTopics).toContain('financial-consistency');
    expect(report.divergentAgents).toContain('BALTHASAR');
  });

  it('Tier 2: should gracefully fail-safe to substantive disagreement on LLM error', async () => {
    // Balthasar divergence causes Tier 1 to trigger Tier 2
    const divergentOutputs: Record<'MELCHIOR' | 'BALTHASAR' | 'CASPER', AgentStructuredOutput> = {
      ...baseOutputs,
      BALTHASAR: {
        ...baseOutputs.BALTHASAR,
        stance: 'REJECT',
      },
    };

    const faultyProvider: any = {
      providerId: 'faulty',
      generateStructured: vi.fn().mockRejectedValue(new Error('Rate limit exceeded')),
    };

    const arbiter = new LLMDisagreementArbiter(faultyProvider);
    const detector = new HybridDisagreementDetector({ arbiter });

    const report = await detector.evaluate(divergentOutputs, 'Any question');

    // Gracefully preserves deliberation rather than crashing
    expect(report.hasSignificantDisagreement).toBe(true);
    expect(report.reason).toContain('Arbiter evaluation encountered an error');
  });
});
