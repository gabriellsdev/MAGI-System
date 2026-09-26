import { describe, it, expect } from 'vitest';
import {
  EpistemicClaimSchema,
  EpistemicAuditSchema,
  AgentStructuredOutputSchema,
  MagiSynthesisOutputSchema,
} from '../../src/domain/schemas.js';
import { MagiCore } from '../../src/deliberation/magi-core.js';
import { MockLanguageModelProvider } from '../../src/providers/mock/mock.provider.js';
import type { AgentStructuredOutput } from '../../src/domain/types.js';

describe('V3 Stage 3: Epistemic Claims & Audit', () => {
  it('should validate epistemic claims across all 5 typologies', () => {
    const validClaim1 = {
      statement: 'PostgreSQL connection pool maxes out at 100 on standard RDS db.t3.medium',
      type: 'FACT',
      confidence: 0.98,
      requiresEvidence: false,
    };
    const validClaim2 = {
      statement: 'Latency spike was caused by unindexed foreign key queries during peak traffic',
      type: 'INFERENCE',
      confidence: 0.85,
      requiresEvidence: true,
    };
    const validClaim3 = {
      statement: 'Traffic will grow by 300% in Q3 following marketing rollout',
      type: 'ASSUMPTION',
      confidence: 0.6,
      requiresEvidence: true,
    };
    const validClaim4 = {
      statement: '80% of database contention is caused by 20% of slow transactions',
      type: 'HEURISTIC',
      confidence: 0.75,
      requiresEvidence: false,
    };
    const validClaim5 = {
      statement: 'Migrating to microservices might introduce network partition bugs',
      type: 'SPECULATION',
      confidence: 0.45,
      requiresEvidence: true,
    };

    expect(EpistemicClaimSchema.parse(validClaim1)).toEqual(validClaim1);
    expect(EpistemicClaimSchema.parse(validClaim2)).toEqual(validClaim2);
    expect(EpistemicClaimSchema.parse(validClaim3)).toEqual(validClaim3);
    expect(EpistemicClaimSchema.parse(validClaim4)).toEqual(validClaim4);
    expect(EpistemicClaimSchema.parse(validClaim5)).toEqual(validClaim5);
  });

  it('should reject invalid epistemic claim types', () => {
    const invalidClaim = {
      statement: 'Invalid type claim',
      type: 'GUESS',
      confidence: 0.5,
      requiresEvidence: true,
    };
    expect(() => EpistemicClaimSchema.parse(invalidClaim)).toThrow();
  });

  it('should parse agent output containing epistemic claims', () => {
    const rawOutput = {
      agentId: 'MELCHIOR',
      stance: 'APPROVE',
      confidence: 0.92,
      summary: 'Empirical benchmark proves 4x throughput improvement.',
      keyArguments: ['Direct memory cache eliminates disk I/O.'],
      criticalAssumptions: ['Redis memory footprint stays within 16GB.'],
      identifiedRisks: ['Single node failure before replication is established.'],
      recommendedAction: 'Deploy Redis caching layer with sentinel failover.',
      claims: [
        {
          statement: 'Benchmark demonstrated 400% throughput increase in synthetic testing',
          type: 'FACT',
          confidence: 0.95,
          requiresEvidence: false,
        },
        {
          statement: 'Write volume will not exceed replica sync speed',
          type: 'ASSUMPTION',
          confidence: 0.7,
          requiresEvidence: true,
        },
      ],
    };

    const parsed = AgentStructuredOutputSchema.parse(rawOutput);
    expect(parsed.claims).toBeDefined();
    expect(parsed.claims?.length).toBe(2);
    expect(parsed.claims?.[0].type).toBe('FACT');
  });

  it('should parse and populate epistemicAudit in MagiCore synthesis', async () => {
    const mockProvider = new MockLanguageModelProvider();
    mockProvider.onGenerate(() => ({
      finalDecision: 'CONSENSUS_REACHED',
      coreVerdict: 'Proceed with staged caching implementation.',
      argumentQualityScore: { MELCHIOR: 9, BALTHASAR: 8, CASPER: 8 },
      decisiveFactors: ['Empirical benchmarks outweighed speculative failure modes.'],
      synthesisSummary: 'Full consensus achieved after epistemic verification.',
      dissentingOpinionsNoted: ['Ensure replication failover testing before live cutover.'],
      epistemicAudit: {
        factCount: 4,
        unverifiedAssumptionsCount: 1,
        evidenceConfidenceScore: 9,
        strongestEvidenceAgent: 'MELCHIOR',
      },
    }));

    const magiCore = new MagiCore(mockProvider);

    const initialAnalysis: Record<'MELCHIOR' | 'BALTHASAR' | 'CASPER', AgentStructuredOutput> = {
      MELCHIOR: {
        agentId: 'MELCHIOR',
        stance: 'APPROVE',
        confidence: 0.9,
        summary: 'Analytical approval based on benchmarks.',
        keyArguments: ['Clear performance gain.'],
        criticalAssumptions: [],
        identifiedRisks: [],
        recommendedAction: 'Proceed.',
        claims: [
          { statement: 'Verified latency reduction', type: 'FACT', confidence: 0.95, requiresEvidence: false },
        ],
      },
      BALTHASAR: {
        agentId: 'BALTHASAR',
        stance: 'APPROVE',
        confidence: 0.85,
        summary: 'Acceptable risk profile.',
        keyArguments: ['Failover is bounded.'],
        criticalAssumptions: ['Sentinel reacts in under 5s.'],
        identifiedRisks: ['Temporary network split.'],
        recommendedAction: 'Proceed with monitoring.',
        claims: [
          { statement: 'Sentinel failover requires minimum 3 nodes', type: 'FACT', confidence: 0.99, requiresEvidence: false },
          { statement: 'Split-brain recovery succeeds automatically', type: 'ASSUMPTION', confidence: 0.6, requiresEvidence: true },
        ],
      },
      CASPER: {
        agentId: 'CASPER',
        stance: 'APPROVE',
        confidence: 0.88,
        summary: 'Pragmatic simple solution.',
        keyArguments: ['Standard architecture.'],
        criticalAssumptions: [],
        identifiedRisks: [],
        recommendedAction: 'Proceed with managed service.',
        claims: [
          { statement: 'Cloud managed Redis has 99.9% uptime SLA', type: 'FACT', confidence: 0.99, requiresEvidence: false },
        ],
      },
    };

    const result = await magiCore.synthesize('Should we implement Redis caching?', initialAnalysis, []);

    expect(result.epistemicAudit).toBeDefined();
    expect(result.epistemicAudit?.factCount).toBe(4);
    expect(result.epistemicAudit?.strongestEvidenceAgent).toBe('MELCHIOR');
  });

  it('should calculate deterministic fallback epistemicAudit if LLM omits it', async () => {
    // Provider does NOT return epistemicAudit in response.data
    const mockProvider = new MockLanguageModelProvider();
    mockProvider.onGenerate(() => ({
      finalDecision: 'CONSENSUS_REACHED',
      coreVerdict: 'Proceed with implementation.',
      argumentQualityScore: { MELCHIOR: 8, BALTHASAR: 8, CASPER: 8 },
      decisiveFactors: ['Fact-based consensus.'],
      synthesisSummary: 'Approved.',
      dissentingOpinionsNoted: [],
    }));

    const magiCore = new MagiCore(mockProvider);

    const initialAnalysis: Record<'MELCHIOR' | 'BALTHASAR' | 'CASPER', AgentStructuredOutput> = {
      MELCHIOR: {
        agentId: 'MELCHIOR',
        stance: 'APPROVE',
        confidence: 0.9,
        summary: 'Summary Melchior',
        keyArguments: ['Arg 1'],
        criticalAssumptions: [],
        identifiedRisks: [],
        recommendedAction: 'Action',
        claims: [
          { statement: 'Fact 1', type: 'FACT', confidence: 0.95, requiresEvidence: false },
          { statement: 'Fact 2', type: 'FACT', confidence: 0.92, requiresEvidence: false },
        ],
      },
      BALTHASAR: {
        agentId: 'BALTHASAR',
        stance: 'APPROVE',
        confidence: 0.85,
        summary: 'Summary Balthasar',
        keyArguments: ['Arg 2'],
        criticalAssumptions: [],
        identifiedRisks: [],
        recommendedAction: 'Action',
        claims: [
          { statement: 'Assumption 1', type: 'ASSUMPTION', confidence: 0.5, requiresEvidence: true },
        ],
      },
      CASPER: {
        agentId: 'CASPER',
        stance: 'APPROVE',
        confidence: 0.85,
        summary: 'Summary Casper',
        keyArguments: ['Arg 3'],
        criticalAssumptions: [],
        identifiedRisks: [],
        recommendedAction: 'Action',
        claims: [
          { statement: 'Heuristic 1', type: 'HEURISTIC', confidence: 0.7, requiresEvidence: false },
        ],
      },
    };

    const result = await magiCore.synthesize('Test question', initialAnalysis, []);

    expect(result.epistemicAudit).toBeDefined();
    expect(result.epistemicAudit?.factCount).toBe(2);
    expect(result.epistemicAudit?.unverifiedAssumptionsCount).toBe(1);
    expect(result.epistemicAudit?.strongestEvidenceAgent).toBe('MELCHIOR');
    expect(result.epistemicAudit?.evidenceConfidenceScore).toBeGreaterThanOrEqual(1);
  });
});
