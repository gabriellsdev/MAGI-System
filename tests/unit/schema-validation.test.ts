import { describe, it, expect } from 'vitest';
import {
  AgentStructuredOutputSchema,
  MagiSynthesisOutputSchema,
  getProviderJsonSchema,
} from '../../src/domain/schemas.js';

describe('Domain Schema Validation', () => {
  it('should validate a valid AgentStructuredOutput', () => {
    const validOutput = {
      agentId: 'MELCHIOR',
      stance: 'APPROVE',
      confidence: 0.95,
      summary: 'Feasible and verified.',
      keyArguments: ['Direct empirical benchmark demonstrates 4x speedup.'],
      criticalAssumptions: ['Workload is CPU bound.'],
      identifiedRisks: ['Learning curve for new engineers.'],
      recommendedAction: 'Proceed with rollout.',
    };

    const parsed = AgentStructuredOutputSchema.parse(validOutput);
    expect(parsed.agentId).toBe('MELCHIOR');
    expect(parsed.confidence).toBe(0.95);
  });

  it('should reject invalid stance enum', () => {
    const invalidOutput = {
      agentId: 'MELCHIOR',
      stance: 'MAYBE_LATER', // Invalid
      confidence: 0.95,
      summary: 'Test',
      keyArguments: ['Arg 1'],
      criticalAssumptions: [],
      identifiedRisks: [],
      recommendedAction: 'Test',
    };

    expect(() => AgentStructuredOutputSchema.parse(invalidOutput)).toThrow();
  });

  it('should reject confidence outside 0.0 - 1.0', () => {
    const invalidConfidence = {
      agentId: 'CASPER',
      stance: 'PIVOT',
      confidence: 1.5, // > 1.0
      summary: 'Test',
      keyArguments: ['Arg 1'],
      criticalAssumptions: [],
      identifiedRisks: [],
      recommendedAction: 'Test',
    };

    expect(() => AgentStructuredOutputSchema.parse(invalidConfidence)).toThrow();
  });

  it('should validate valid MagiSynthesisOutput', () => {
    const validSynthesis = {
      finalDecision: 'CONSENSUS_REACHED',
      coreVerdict: 'Proceed with implementation.',
      argumentQualityScore: {
        MELCHIOR: 9,
        BALTHASAR: 8,
        CASPER: 8,
      },
      decisiveFactors: ['High empirical benchmark performance.'],
      synthesisSummary: 'Full agreement across analytical, critical, and lateral axes.',
      dissentingOpinionsNoted: [],
    };

    const parsed = MagiSynthesisOutputSchema.parse(validSynthesis);
    expect(parsed.finalDecision).toBe('CONSENSUS_REACHED');
    expect(parsed.argumentQualityScore.MELCHIOR).toBe(9);
  });

  it('should coerce decimal 0.0-1.0 quality scores to 1-10 integers', () => {
    const decimalSynthesis = {
      finalDecision: 'CONDITIONAL_PASS',
      coreVerdict: 'Proceed with staged canary deployment.',
      argumentQualityScore: {
        MELCHIOR: 0.8,
        BALTHASAR: 0.7,
        CASPER: 0.85,
      },
      decisiveFactors: ['Performance viability balanced with migration cost.'],
      synthesisSummary: 'Compromise reached across personas.',
      dissentingOpinionsNoted: ['Cost of Rust adoption'],
      decisionMetrics: {
        decisionConfidence: 0.75,
        dissentStrength: 0.3,
        reversibility: 0.8,
        riskSeverity: 0.4,
        evidenceQuality: 0.8,
      },
    };

    const parsed = MagiSynthesisOutputSchema.parse(decimalSynthesis);
    expect(parsed.argumentQualityScore.MELCHIOR).toBe(8);
    expect(parsed.argumentQualityScore.BALTHASAR).toBe(7);
    expect(parsed.argumentQualityScore.CASPER).toBe(9);
    expect(parsed.decisionMetrics?.evidenceQuality).toBe(8);
  });

  it('should coerce numeric string and clamp out-of-range quality scores', () => {
    const stringAndClamped = {
      finalDecision: 'REJECTED',
      coreVerdict: 'Halt implementation due to catastrophic failure risk.',
      argumentQualityScore: {
        MELCHIOR: '0.9',
        BALTHASAR: 15, // Clamped to 10
        CASPER: -2,   // Clamped to 1
      },
      decisiveFactors: ['Critical safety hazard.'],
      synthesisSummary: 'Rejected by Balthasar.',
      dissentingOpinionsNoted: [],
      decisionMetrics: {
        decisionConfidence: 0.9,
        dissentStrength: 0.8,
        reversibility: 0.2,
        riskSeverity: 0.9,
        evidenceQuality: '7.5',
      },
    };

    const parsed = MagiSynthesisOutputSchema.parse(stringAndClamped);
    expect(parsed.argumentQualityScore.MELCHIOR).toBe(9);
    expect(parsed.argumentQualityScore.BALTHASAR).toBe(10);
    expect(parsed.argumentQualityScore.CASPER).toBe(1);
    expect(parsed.decisionMetrics?.evidenceQuality).toBe(7.5);
  });

  it('should produce a valid JSON schema for LLM providers', () => {
    const jsonSchema = getProviderJsonSchema(AgentStructuredOutputSchema, 'AgentStructuredOutput');
    expect(jsonSchema).toBeDefined();
    expect(typeof jsonSchema).toBe('object');

    const synthesisSchema = getProviderJsonSchema(MagiSynthesisOutputSchema, 'MagiSynthesisOutput');
    expect(synthesisSchema).toBeDefined();
    expect(typeof synthesisSchema).toBe('object');
  });
});
