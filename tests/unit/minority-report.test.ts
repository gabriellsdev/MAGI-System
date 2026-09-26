import { describe, it, expect } from 'vitest';
import { MinorityReportSchema } from '../../src/domain/schemas.js';
import { MagiCore } from '../../src/deliberation/magi-core.js';
import { MockLanguageModelProvider } from '../../src/providers/mock/mock.provider.js';
import type { AgentId, AgentStructuredOutput, MinorityReport } from '../../src/domain/types.js';

describe('V3.2 Core Component: Minority Report & Reversal Conditions', () => {
  it('should validate conforming MinorityReportSchema objects', () => {
    const validReport: MinorityReport = {
      decision: 'CONDITIONAL_PASS',
      dissentingAgent: 'BALTHASAR',
      minorityConcern: 'Risk of catastrophic delivery schedule slip during full rewrite.',
      supportingFactors: [
        '9-month complete development freeze on customer-facing features.',
        'High developer ramp-up cost and cognitive friction.'
      ],
      reversalConditions: [
        'Team attrition exceeds 15% in Q1.',
        'P99 latency does not improve by at least 40% in initial canary microservice.'
      ]
    };

    const parsed = MinorityReportSchema.safeParse(validReport);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.dissentingAgent).toBe('BALTHASAR');
      expect(parsed.data.reversalConditions.length).toBe(2);
    }
  });

  it('should synthesize minority report with reversal conditions in MagiCore', async () => {
    const mockProvider = new MockLanguageModelProvider();
    mockProvider.onGenerate(() => ({
      finalDecision: 'CONDITIONAL_PASS',
      coreVerdict: 'Approve scoped Rust migration for high-throughput edge proxy.',
      synthesisSummary: 'Melchior and Casper favor proxy isolation, while Balthasar dissents on organizational risk.',
      decisiveFactors: ['Network proxy is latency-critical', 'Keep CRUD services untouched'],
      argumentQualityScore: { MELCHIOR: 9, BALTHASAR: 8, CASPER: 8 },
      dissentingOpinionsNoted: ['Balthasar warns of existential delivery stalls'],
      minorityReport: {
        decision: 'CONDITIONAL_PASS',
        dissentingAgent: 'BALTHASAR',
        minorityConcern: 'Complete rewrite poses unacceptable operational and staffing risks.',
        supportingFactors: ['Delivery freeze', 'Staff ramp-up time'],
        reversalConditions: [
          'If compiler ramp-up delays exceed 4 weeks, abort Rust migration immediately.',
          'If proxy p99 latency does not drop under 5ms, rollback to Go proxy.'
        ]
      },
      decisionMetrics: {
        decisionConfidence: 0.82,
        dissentStrength: 0.74,
        reversibility: 0.88,
        riskSeverity: 0.65,
        evidenceQuality: 8.7
      }
    }));

    const magiCore = new MagiCore(mockProvider);

    const initialOutputs: Record<AgentId, AgentStructuredOutput> = {
      MELCHIOR: {
        agentId: 'MELCHIOR',
        stance: 'APPROVE',
        confidenceScore: 0.9,
        keyArguments: ['Zero-cost abstractions reduce p99'],
        identifiedRisks: ['Async runtime nuances'],
        reasoning: 'Memory safety without GC pauses',
      },
      BALTHASAR: {
        agentId: 'BALTHASAR',
        stance: 'REJECT',
        confidenceScore: 0.85,
        keyArguments: ['9-month delivery freeze risk'],
        identifiedRisks: ['Existential developer attrition'],
        reasoning: 'Feature velocity freeze is catastrophic',
      },
      CASPER: {
        agentId: 'CASPER',
        stance: 'PIVOT',
        confidenceScore: 0.88,
        keyArguments: ['Isolate proxy service only'],
        identifiedRisks: ['Multi-language operational overhead'],
        reasoning: 'Canary isolation balances risk and reward',
      },
    };

    const result = await magiCore.synthesize('Rewrite backend in Rust?', initialOutputs, []);

    expect(result.minorityReport).toBeDefined();
    expect(result.minorityReport?.dissentingAgent).toBe('BALTHASAR');
    expect(result.minorityReport?.minorityConcern).toContain('rewrite poses unacceptable operational');
    expect(result.minorityReport?.reversalConditions.length).toBeGreaterThanOrEqual(2);
    expect(result.minorityReport?.reversalConditions[0]).toContain('abort');
  });

  it('should synthesize deterministic fallback minority report if LLM response omits it', async () => {
    const mockProvider = new MockLanguageModelProvider();
    // Return legacy payload without minorityReport
    mockProvider.onGenerate(() => ({
      finalDecision: 'CONSENSUS_REACHED',
      coreVerdict: 'Proceed with rollout.',
      synthesisSummary: 'Consensus reached with minor dissent.',
      decisiveFactors: ['High performance advantage'],
      argumentQualityScore: { MELCHIOR: 9, BALTHASAR: 7, CASPER: 8 },
      dissentingOpinionsNoted: ['Balthasar remains concerned about long-term maintenance overhead.'],
    }));

    const magiCore = new MagiCore(mockProvider);

    const initialOutputs: Record<AgentId, AgentStructuredOutput> = {
      MELCHIOR: {
        agentId: 'MELCHIOR',
        stance: 'APPROVE',
        confidenceScore: 0.9,
        keyArguments: ['Speed'],
        identifiedRisks: [],
        reasoning: 'Fast',
      },
      BALTHASAR: {
        agentId: 'BALTHASAR',
        stance: 'REJECT',
        confidenceScore: 0.8,
        keyArguments: ['Maintenance overhead'],
        identifiedRisks: ['Operational burden'],
        reasoning: 'High risk',
      },
      CASPER: {
        agentId: 'CASPER',
        stance: 'APPROVE',
        confidenceScore: 0.85,
        keyArguments: ['Practical'],
        identifiedRisks: [],
        reasoning: 'Works',
      },
    };

    const result = await magiCore.synthesize('Proceed with rollout?', initialOutputs, []);

    expect(result.minorityReport).toBeDefined();
    expect(result.minorityReport?.dissentingAgent).toBe('BALTHASAR');
    expect(result.minorityReport?.reversalConditions.length).toBeGreaterThanOrEqual(1);
  });
});
