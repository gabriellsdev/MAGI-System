import { describe, it, expect } from 'vitest';
import { MagiCore } from '../../src/deliberation/magi-core.js';
import { MockLanguageModelProvider } from '../../src/providers/mock/mock.provider.js';
import type { AgentId, AgentStructuredOutput } from '../../src/domain/types.js';

describe('V3.4 Metacognitive Safety Gate (EPISTEMIC_HALT)', () => {
  it('should trigger EPISTEMIC_HALT when high dissent, low reversibility, and fragile evidence converge', async () => {
    const mockProvider = new MockLanguageModelProvider();

    // LLM attempts to return CONDITIONAL_PASS despite catastrophic one-way door
    mockProvider.onGenerate(() => ({
      finalDecision: 'CONDITIONAL_PASS',
      coreVerdict: 'Proceed with irreversible complete database wipe and rewrite.',
      synthesisSummary: 'High dissent exists, but majority suggests trying.',
      decisiveFactors: ['Theoretical performance gains'],
      argumentQualityScore: { MELCHIOR: 7, BALTHASAR: 8, CASPER: 6 },
      dissentingOpinionsNoted: ['Balthasar warns of existential unrecoverable data loss'],
      decisionMetrics: {
        decisionConfidence: 0.65,
        dissentStrength: 0.78,    // High dissent (>= 0.60)
        reversibility: 0.15,      // Low reversibility (<= 0.40 - one-way door)
        riskSeverity: 0.95,       // Severe risk (>= 0.70)
        evidenceQuality: 4.5,     // Fragile evidence (<= 6.0)
      },
    }));

    const magiCore = new MagiCore(mockProvider);

    const initialOutputs: Record<AgentId, AgentStructuredOutput> = {
      MELCHIOR: {
        agentId: 'MELCHIOR',
        stance: 'APPROVE',
        confidence: 0.75,
        summary: 'Theoretical performance justification',
        keyArguments: ['Clean slate architecture'],
        criticalAssumptions: ['Data can be reconstructed from logs'],
        identifiedRisks: ['Data loss'],
        recommendedAction: 'Proceed with wipe',
      },
      BALTHASAR: {
        agentId: 'BALTHASAR',
        stance: 'REJECT',
        confidence: 0.95,
        summary: 'Catastrophic risk of permanent data corruption',
        keyArguments: ['Irreversible destruction of production history'],
        criticalAssumptions: [],
        identifiedRisks: ['Existential enterprise failure'],
        recommendedAction: 'Abort immediately',
      },
      CASPER: {
        agentId: 'CASPER',
        stance: 'INCONCLUSIVE',
        confidence: 0.50,
        summary: 'Insufficient empirical benchmarks',
        keyArguments: ['No recovery dry-run executed'],
        criticalAssumptions: [],
        identifiedRisks: ['Backup integrity unproven'],
        recommendedAction: 'Freeze',
      },
    };

    const result = await magiCore.synthesize('Should we wipe the database?', initialOutputs, []);

    // Metacognitive Circuit Breaker must override the decision to EPISTEMIC_HALT
    expect(result.finalDecision).toBe('EPISTEMIC_HALT');
    expect(result.metacognitiveHalt).toBe(true);
    expect(result.coreVerdict).toContain('[EPISTEMIC_HALT] AUTONOMOUS CLEARANCE REFUSED');
    expect(result.decisiveFactors[0]).toContain('[EPISTEMIC_HALT]');
    expect(result.minorityReport?.decision).toBe('EPISTEMIC_HALT');
    expect(result.minorityReport?.contracts?.length).toBeGreaterThanOrEqual(1);
  });

  it('should allow normal resolution when reversibility is high and evidence is strong', async () => {
    const mockProvider = new MockLanguageModelProvider();

    mockProvider.onGenerate(() => ({
      finalDecision: 'CONSENSUS_REACHED',
      coreVerdict: 'Deploy blue-green canary with zero-downtime rollback capability.',
      synthesisSummary: 'Triad agrees canary deployment is safe and fully reversible.',
      decisiveFactors: ['Instant zero-downtime rollback', 'Empirical canary validation'],
      argumentQualityScore: { MELCHIOR: 9, BALTHASAR: 9, CASPER: 9 },
      dissentingOpinionsNoted: [],
      decisionMetrics: {
        decisionConfidence: 0.92,
        dissentStrength: 0.15,
        reversibility: 0.95,      // Highly reversible
        riskSeverity: 0.25,       // Low risk
        evidenceQuality: 9.0,     // Strong evidence
      },
    }));

    const magiCore = new MagiCore(mockProvider);

    const initialOutputs: Record<AgentId, AgentStructuredOutput> = {
      MELCHIOR: {
        agentId: 'MELCHIOR',
        stance: 'APPROVE',
        confidence: 0.92,
        summary: 'Canary ready',
        keyArguments: ['Canary tested'],
        criticalAssumptions: [],
        identifiedRisks: [],
        recommendedAction: 'Deploy canary',
      },
      BALTHASAR: {
        agentId: 'BALTHASAR',
        stance: 'APPROVE',
        confidence: 0.90,
        summary: 'Rollback verified',
        keyArguments: ['Instant rollback tested'],
        criticalAssumptions: [],
        identifiedRisks: [],
        recommendedAction: 'Deploy canary',
      },
      CASPER: {
        agentId: 'CASPER',
        stance: 'APPROVE',
        confidence: 0.94,
        summary: 'Safe rollout',
        keyArguments: ['1% traffic split'],
        criticalAssumptions: [],
        identifiedRisks: [],
        recommendedAction: 'Deploy canary',
      },
    };

    const result = await magiCore.synthesize('Deploy canary release?', initialOutputs, []);

    expect(result.finalDecision).toBe('CONSENSUS_REACHED');
    expect(result.metacognitiveHalt).toBe(false);
    expect(result.minorityReport?.contracts?.length).toBeGreaterThanOrEqual(1);
  });
});
