import { describe, it, expect } from 'vitest';
import { DecisionMetricsSchema } from '../../src/domain/schemas.js';
import { MagiCore } from '../../src/deliberation/magi-core.js';
import { MockLanguageModelProvider } from '../../src/providers/mock/mock.provider.js';
import type { AgentId, AgentStructuredOutput, DecisionMetrics } from '../../src/domain/types.js';

describe('V3.2 Core Component: Decision Risk Metrics', () => {
  it('should validate valid DecisionMetricsSchema data', () => {
    const validMetrics: DecisionMetrics = {
      decisionConfidence: 0.85,
      dissentStrength: 0.40,
      reversibility: 0.75,
      riskSeverity: 0.55,
      evidenceQuality: 8.8,
    };

    const parsed = DecisionMetricsSchema.safeParse(validMetrics);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.decisionConfidence).toBe(0.85);
      expect(parsed.data.riskSeverity).toBe(0.55);
    }
  });

  it('should reject out-of-bounds metrics', () => {
    const invalidConfidence = {
      decisionConfidence: 1.5, // Exceeds 1.0
      dissentStrength: 0.2,
      reversibility: 0.5,
      riskSeverity: 0.4,
      evidenceQuality: 7.0,
    };
    expect(DecisionMetricsSchema.safeParse(invalidConfidence).success).toBe(false);

    const invalidRisk = {
      decisionConfidence: 0.8,
      dissentStrength: 0.2,
      reversibility: 0.5,
      riskSeverity: 1.5, // Exceeds 1.0
      evidenceQuality: 7.0,
    };
    expect(DecisionMetricsSchema.safeParse(invalidRisk).success).toBe(false);

    const negativeReversibility = {
      decisionConfidence: 0.8,
      dissentStrength: 0.2,
      reversibility: -0.1, // Negative
      riskSeverity: 0.5,
      evidenceQuality: 7.0,
    };
    expect(DecisionMetricsSchema.safeParse(negativeReversibility).success).toBe(false);
  });

  it('should calibrate fallback decision metrics in MagiCore when omitted by LLM', async () => {
    const mockProvider = new MockLanguageModelProvider();
    mockProvider.onGenerate(() => ({
      finalDecision: 'CONSENSUS_REACHED',
      coreVerdict: 'Approve execution.',
      synthesisSummary: 'Unanimous alignment reached.',
      decisiveFactors: ['Zero opposition'],
      argumentQualityScore: { MELCHIOR: 9, BALTHASAR: 9, CASPER: 9 },
      dissentingOpinionsNoted: [],
    }));

    const magiCore = new MagiCore(mockProvider);

    const initialOutputs: Record<AgentId, AgentStructuredOutput> = {
      MELCHIOR: {
        agentId: 'MELCHIOR',
        stance: 'APPROVE',
        confidenceScore: 0.95,
        keyArguments: ['Direct synergy'],
        identifiedRisks: [],
        reasoning: 'High value',
      },
      BALTHASAR: {
        agentId: 'BALTHASAR',
        stance: 'APPROVE',
        confidenceScore: 0.92,
        keyArguments: ['Regulatory compliant'],
        identifiedRisks: [],
        reasoning: 'Safe',
      },
      CASPER: {
        agentId: 'CASPER',
        stance: 'APPROVE',
        confidenceScore: 0.90,
        keyArguments: ['Low overhead'],
        identifiedRisks: [],
        reasoning: 'Practical',
      },
    };

    const result = await magiCore.synthesize('Proceed with compliant migration?', initialOutputs, []);

    expect(result.decisionMetrics).toBeDefined();
    expect(result.decisionMetrics?.decisionConfidence).toBeGreaterThanOrEqual(0.8);
    expect(result.decisionMetrics?.dissentStrength).toBeLessThanOrEqual(0.2);
    expect(result.decisionMetrics?.riskSeverity).toBeGreaterThanOrEqual(0.0);
    expect(result.decisionMetrics?.riskSeverity).toBeLessThanOrEqual(1.0);
    expect(result.decisionMetrics?.evidenceQuality).toBeGreaterThanOrEqual(7);
  });
});
