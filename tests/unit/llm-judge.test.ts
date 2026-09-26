import { describe, it, expect } from 'vitest';
import { LLMJudge } from '../../src/evaluation/llm-judge.js';
import { MockLanguageModelProvider } from '../../src/providers/mock/mock.provider.js';
import type { SingleModelResponse } from '../../src/comparison/comparison.types.js';
import type { MagiSynthesisResult } from '../../src/domain/types.js';
import type { BenchmarkDilemma } from '../../src/benchmark/benchmark.types.js';
import type { PairwiseJudgeOutput } from '../../src/evaluation/evaluation.types.js';

describe('LLMJudge (G-Eval Blinded Pairwise Evaluation)', () => {
  const sampleDilemma: BenchmarkDilemma = {
    id: 'arch-rust-rewrite',
    title: 'Complete Backend Rewrite in Rust',
    category: 'SYSTEM_ARCHITECTURE',
    question: 'Should our engineering organization migrate all backend services to Rust?',
    description: 'Evaluates complete rewrite vs maintainability and delivery risk.',
    expectedConflict: 'Zero-cost performance vs delivery schedule collapse.',
    keyTradeoffs: ['Sub-millisecond p99 latency vs developer ramp', 'Memory safety vs borrow checker overhead'],
  };

  const sampleSingle: SingleModelResponse = {
    model: 'gemini-3.1-pro-preview',
    summary: 'Gemini baseline recommends caution before rewriting in Rust.',
    pros: ['Rust offers memory safety without garbage collection.', 'High performance concurrency.'],
    cons: ['Steep learning curve.', 'Rewriting working software introduces regressions.'],
    verdict: 'Do not rewrite; optimize Go hot paths first.',
  };

  const sampleMagi: MagiSynthesisResult = {
    finalDecision: 'CONDITIONAL_PASS',
    coreVerdict: 'MAGI Core approves incremental migration of CPU-bound bottlenecks only.',
    deliberationRoundsCount: 1,
    initialAnalysis: {
      MELCHIOR: {
        agentId: 'MELCHIOR',
        stance: 'APPROVE',
        confidenceScore: 0.88,
        keyArguments: ['Melchior-1 asserts zero-cost abstractions eliminate latency tails.'],
        identifiedRisks: ['Ecosystem library maturity for niche protocols.'],
        reasoning: 'Empirical memory benchmarks show 3x throughput.',
      },
      BALTHASAR: {
        agentId: 'BALTHASAR',
        stance: 'REJECT',
        confidenceScore: 0.92,
        keyArguments: ['Balthasar-2 warns total rewrite halts feature delivery for 9 months.'],
        identifiedRisks: ['Developer attrition and delivery deadlock.'],
        reasoning: 'Risk of existential product stall is unacceptable.',
      },
      CASPER: {
        agentId: 'CASPER',
        stance: 'PIVOT',
        confidenceScore: 0.85,
        keyArguments: ['Casper-3 proposes isolating the edge proxy into Rust while keeping backend services.'],
        identifiedRisks: ['Multi-language operational complexity.'],
        reasoning: 'Pragmatic compromise balances speed with stability.',
      },
    },
    rounds: [],
    synthesisSummary: 'The MAGI supercomputer recommends a targeted canary extraction of latency bottlenecks.',
    decisiveFactors: ['Extract the proxy service to Rust', 'Leave core CRUD services untouched'],
    dissentingOpinionsNoted: ['Dual-language deployment overhead'],
    argumentQualityScore: {
      MELCHIOR: 8.5,
      BALTHASAR: 9.0,
      CASPER: 9.5,
    },
    consensusMetrics: {
      finalStanceSpread: 0.07,
      disagreementResolved: true,
    },
  };

  it('should sanitize identifying tokens from both Single and MAGI responses', () => {
    const mockProvider = new MockLanguageModelProvider();
    const judge = new LLMJudge(mockProvider);

    const canonSingle = judge.canonicalizeSingle(sampleSingle);
    expect(canonSingle.executiveSummary).not.toContain('Gemini');
    expect(canonSingle.finalRecommendation).toBeDefined();

    const canonMagi = judge.canonicalizeMagi(sampleMagi);
    expect(canonMagi.executiveSummary).not.toContain('MAGI');
    expect(canonMagi.finalRecommendation).not.toContain('MAGI');
    expect(canonMagi.keyArguments.every(a => !a.includes('Melchior-1') && !a.includes('Balthasar-2'))).toBe(true);
  });

  it('should create blinded pair with random or deterministic positions', () => {
    const mockProvider = new MockLanguageModelProvider();
    const judge = new LLMJudge(mockProvider);

    const pairDeterministic = judge.createBlindedPair(sampleDilemma, sampleSingle, sampleMagi, false);

    expect(pairDeterministic.solutionA.candidateId).toBe('A');
    expect(pairDeterministic.solutionB.candidateId).toBe('B');
    expect(pairDeterministic.mapping.A).toBe('SINGLE');
    expect(pairDeterministic.mapping.B).toBe('MAGI');
  });

  it('should evaluate blinded pair with structured 4-dimension scores', async () => {
    const mockProvider = new MockLanguageModelProvider();
    const mockOutput: PairwiseJudgeOutput = {
      candidateAScores: {
        reasoningQuality: 7.0,
        completeness: 6.5,
        robustness: 7.0,
        actionability: 6.0,
        rationale: 'Sound but somewhat standard recommendations.',
      },
      candidateBScores: {
        reasoningQuality: 8.5,
        completeness: 9.0,
        robustness: 8.5,
        actionability: 8.5,
        rationale: 'Strong synthesis with practical phased implementation plan.',
      },
      winner: 'CANDIDATE_B',
      margin: 'MODERATE',
      comparativeAnalysis: 'Candidate B provides explicit incremental phasing.',
    };

    mockProvider.onGenerate(() => mockOutput);

    const judge = new LLMJudge(mockProvider);
    const pair = judge.createBlindedPair(sampleDilemma, sampleSingle, sampleMagi, false);
    const result = await judge.evaluatePairwise(pair);

    expect(result).toBeDefined();
    expect(result.candidateAScores.reasoningQuality).toBe(7.0);
    expect(result.candidateBScores.reasoningQuality).toBe(8.5);
    expect(result.winner).toBe('CANDIDATE_B');
    expect(result.margin).toBe('MODERATE');
  });

  it('should evaluate with position swapping to eliminate position bias', async () => {
    const mockProvider = new MockLanguageModelProvider();

    // Mock returns consistent scores regardless of order
    mockProvider.onGenerate(req => {
      const isMagiA = req.messages[0].content.includes('SOLUTION A:\nExecutive Summary:\nThe Strategic Advisory System');
      if (isMagiA) {
        return {
          candidateAScores: { reasoningQuality: 9.0, completeness: 9.0, robustness: 8.5, actionability: 9.0, rationale: 'Magi as A' },
          candidateBScores: { reasoningQuality: 7.0, completeness: 7.0, robustness: 6.5, actionability: 7.0, rationale: 'Single as B' },
          winner: 'CANDIDATE_A',
          margin: 'SIGNIFICANT',
          comparativeAnalysis: 'Candidate A is superior.',
        };
      } else {
        return {
          candidateAScores: { reasoningQuality: 7.0, completeness: 7.0, robustness: 6.5, actionability: 7.0, rationale: 'Single as A' },
          candidateBScores: { reasoningQuality: 9.0, completeness: 9.0, robustness: 8.5, actionability: 9.0, rationale: 'Magi as B' },
          winner: 'CANDIDATE_B',
          margin: 'SIGNIFICANT',
          comparativeAnalysis: 'Candidate B is superior.',
        };
      }
    });

    const judge = new LLMJudge(mockProvider);
    const result = await judge.evaluateWithPositionSwap(sampleDilemma, sampleSingle, sampleMagi);

    expect(result.singleScores.reasoningQuality).toBe(7.0);
    expect(result.magiScores.reasoningQuality).toBe(9.0);
    expect(result.winner).toBe('MAGI');
    expect(result.margin).toBe('SIGNIFICANT');
  });
});
