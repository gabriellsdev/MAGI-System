import { describe, it, expect } from 'vitest';
import { createMagiSystem } from '../../src/index.js';
import { MockLanguageModelProvider } from '../../src/providers/mock/mock.provider.js';
import type { AgentStructuredOutput } from '../../src/domain/types.js';

describe('V3.2 Model Diversity Advanced: Triad Model Heterogeneity', () => {
  it('should route each agent through dedicated model configurations and track per-model calls', async () => {
    const melchiorMock = new MockLanguageModelProvider();
    const balthasarMock = new MockLanguageModelProvider();
    const casperMock = new MockLanguageModelProvider();
    const coreMock = new MockLanguageModelProvider();

    melchiorMock.onGenerate(req => {
      expect(req.model).toBe('gemini-3.1-pro-preview');
      return {
        agentId: 'MELCHIOR',
        stance: 'APPROVE',
        confidence: 0.92,
        summary: 'Pro model delivers high-depth formal reasoning.',
        keyArguments: ['Deep analytical proof of memory safety'],
        criticalAssumptions: ['Rust compiler guarantees memory safety'],
        identifiedRisks: ['Async runtime integration'],
        recommendedAction: 'Approve isolated rollout of proxy layer',
      } satisfies AgentStructuredOutput;
    });

    balthasarMock.onGenerate(req => {
      expect(req.model).toBe('claude-3-7-sonnet');
      return {
        agentId: 'BALTHASAR',
        stance: 'REJECT',
        confidence: 0.88,
        summary: 'Sonnet model provides hyper-vigilant risk defense.',
        keyArguments: ['Adversarial boundary vulnerability'],
        criticalAssumptions: ['Production traffic contains malformed payloads'],
        identifiedRisks: ['Unintended operational complexity'],
        recommendedAction: 'Reject unmonitored rollout; require formal gateway sandbox',
      } satisfies AgentStructuredOutput;
    });

    casperMock.onGenerate(req => {
      expect(req.model).toBe('gemini-2.5-flash');
      return {
        agentId: 'CASPER',
        stance: 'PIVOT',
        confidence: 0.85,
        summary: 'Flash model provides ultra-fast practical compromise.',
        keyArguments: ['Pragmatic container boundary extraction'],
        criticalAssumptions: ['Container orchestration can isolate memory faults'],
        identifiedRisks: ['Network latency jitter'],
        recommendedAction: 'Deploy isolated canary proxy with traffic mirroring',
      } satisfies AgentStructuredOutput;
    });

    coreMock.onGenerate(() => ({
      finalDecision: 'CONDITIONAL_PASS',
      coreVerdict: 'Approve isolated rollout with canary telemetry.',
      synthesisSummary: 'Triad reaches consensus across heterogeneous model perspectives.',
      decisiveFactors: ['Balancing deep proof with risk defense and pragmatism'],
      argumentQualityScore: { MELCHIOR: 9, BALTHASAR: 9, CASPER: 8 },
      dissentingOpinionsNoted: ['Balthasar cautioned against unmonitored rollout'],
      minorityReport: {
        decision: 'CONDITIONAL_PASS',
        dissentingAgent: 'BALTHASAR',
        minorityConcern: 'Canary might leak edge cases to production traffic.',
        supportingFactors: ['Boundary vulnerability'],
        reversalConditions: ['Error rate exceeds 0.05% during canary.']
      },
      decisionMetrics: {
        decisionConfidence: 0.89,
        dissentStrength: 0.45,
        reversibility: 0.80,
        riskSeverity: 0.50,
        evidenceQuality: 9.1
      }
    }));

    const magi = createMagiSystem({
      provider: coreMock,
      agentProviders: {
        MELCHIOR: melchiorMock,
        BALTHASAR: balthasarMock,
        CASPER: casperMock,
      },
      agentModels: {
        MELCHIOR: 'gemini-3.1-pro-preview',
        BALTHASAR: 'claude-3-7-sonnet',
        CASPER: 'gemini-2.5-flash',
      },
    });

    const result = await magi.run('Evaluate containerized edge proxy migration.');

    expect(result).toBeDefined();
    expect(result.finalDecision).toBe('CONDITIONAL_PASS');
    expect(result.initialAnalysis.MELCHIOR.summary).toContain('Pro model delivers');
    expect(result.initialAnalysis.BALTHASAR.summary).toContain('Sonnet model provides');
    expect(result.initialAnalysis.CASPER.summary).toContain('Flash model provides');

    // Confirm each independent mock recorded the exact configured model name
    expect(melchiorMock.callHistory[0].model).toBe('gemini-3.1-pro-preview');
    expect(balthasarMock.callHistory[0].model).toBe('claude-3-7-sonnet');
    expect(casperMock.callHistory[0].model).toBe('gemini-2.5-flash');
  });
});
