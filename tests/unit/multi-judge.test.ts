import { describe, it, expect } from 'vitest';
import { LLMJudge } from '../../src/evaluation/llm-judge.js';
import { MockLanguageModelProvider } from '../../src/providers/mock/mock.provider.js';
import type { BlindedPairContext, PairwiseJudgeOutput } from '../../src/evaluation/evaluation.types.js';

describe('V3.2 Evaluation Enhancement: Multi-Judge Ensemble in G-Eval', () => {
  const samplePairContext: BlindedPairContext = {
    dilemmaId: 'test-dilemma-1',
    category: 'SYSTEM_ARCHITECTURE',
    question: 'Should we replace REST with gRPC across all internal microservices?',
    keyTradeoffs: ['HTTP/2 multiplexing vs browser debugging difficulty', 'Protobuf schema enforcement vs rapid prototyping'],
    solutionA: {
      candidateId: 'A',
      executiveSummary: 'Retain REST with OpenAPI specifications and enforce HTTP/2 at the ingress gateway.',
      keyArguments: ['Immediate developer productivity', 'Simpler observability and curl debugging'],
      identifiedRisks: ['Higher serialization overhead at high QPS'],
      finalRecommendation: 'Keep REST and adopt Protobuf selectively for high-throughput batching.',
    },
    solutionB: {
      candidateId: 'B',
      executiveSummary: 'Phased migration to gRPC with a centralized schema registry and automated proto codegen.',
      keyArguments: ['Strict typing eliminates API mismatch regressions', 'Up to 7x reduction in CPU serialization time'],
      identifiedRisks: ['Internal load balancing requires L7 proxies', 'Developer learning curve'],
      finalRecommendation: 'Migrate core internal tier to gRPC behind an Envoy gateway.',
    },
    mapping: {
      A: 'SINGLE_LLM',
      B: 'MAGI_CORE',
    },
  };

  it('should execute 3 independent judge runs and calculate mean, stdDev, and agreement', async () => {
    const mock = new MockLanguageModelProvider();

    // Configure 3 sequential judge outputs with minor variance
    let callCount = 0;
    mock.onGenerate(() => {
      callCount++;
      if (callCount === 1) {
        return {
          candidateAScores: { reasoningQuality: 7.0, completeness: 7.0, robustness: 7.0, actionability: 7.0, rationale: 'Judge 1 on A' },
          candidateBScores: { reasoningQuality: 9.0, completeness: 9.0, robustness: 9.0, actionability: 9.0, rationale: 'Judge 1 on B' },
          winner: 'CANDIDATE_B',
          margin: 'SIGNIFICANT',
          comparativeAnalysis: 'B is superior in scale planning.',
        } satisfies PairwiseJudgeOutput;
      }
      if (callCount === 2) {
        return {
          candidateAScores: { reasoningQuality: 7.5, completeness: 7.2, robustness: 6.8, actionability: 7.5, rationale: 'Judge 2 on A' },
          candidateBScores: { reasoningQuality: 8.8, completeness: 9.2, robustness: 8.6, actionability: 9.0, rationale: 'Judge 2 on B' },
          winner: 'CANDIDATE_B',
          margin: 'MODERATE',
          comparativeAnalysis: 'B has clearer phased milestones.',
        } satisfies PairwiseJudgeOutput;
      }
      return {
        candidateAScores: { reasoningQuality: 6.8, completeness: 6.8, robustness: 7.2, actionability: 7.2, rationale: 'Judge 3 on A' },
        candidateBScores: { reasoningQuality: 9.2, completeness: 8.8, robustness: 9.4, actionability: 9.2, rationale: 'Judge 3 on B' },
        winner: 'CANDIDATE_B',
        margin: 'SIGNIFICANT',
        comparativeAnalysis: 'B provides robust rollback criteria.',
      } satisfies PairwiseJudgeOutput;
    });

    const judge = new LLMJudge(mock);
    const ensemble = await judge.evaluateWithMultiJudgeEnsemble(samplePairContext, 3);

    expect(ensemble.judgeCount).toBe(3);
    expect(ensemble.runs.length).toBe(3);
    expect(callCount).toBe(3);

    // Verify Candidate B averages and stdDev
    expect(ensemble.candidateB.meanScores.reasoningQuality).toBe(9.0);
    expect(ensemble.candidateB.stats.reasoningQuality.mean).toBe(9.0);
    expect(ensemble.candidateB.stats.reasoningQuality.stdDev).toBeGreaterThan(0);

    // Verify consensus and unanimous agreement (3/3 = 1.0)
    expect(ensemble.consensusWinner).toBe('CANDIDATE_B');
    expect(ensemble.interJudgeAgreement).toBe(1.0);
    expect(ensemble.consensusMargin).toBe('SIGNIFICANT');
    expect(ensemble.summaryAnalysis).toContain('Consensus winner CANDIDATE_B');
  });

  it('should accurately handle mixed judge verdicts and compute agreement fraction', async () => {
    const mock = new MockLanguageModelProvider();

    let callCount = 0;
    mock.onGenerate(() => {
      callCount++;
      if (callCount === 1) {
        return {
          candidateAScores: { reasoningQuality: 8.0, completeness: 8.0, robustness: 8.0, actionability: 8.0, rationale: 'A is fine' },
          candidateBScores: { reasoningQuality: 8.5, completeness: 8.5, robustness: 8.5, actionability: 8.5, rationale: 'B is better' },
          winner: 'CANDIDATE_B',
          margin: 'SLIGHT',
          comparativeAnalysis: 'Slight edge to B.',
        };
      }
      if (callCount === 2) {
        return {
          candidateAScores: { reasoningQuality: 8.5, completeness: 8.5, robustness: 8.5, actionability: 8.5, rationale: 'A is better' },
          candidateBScores: { reasoningQuality: 8.0, completeness: 8.0, robustness: 8.0, actionability: 8.0, rationale: 'B is worse' },
          winner: 'CANDIDATE_A',
          margin: 'SLIGHT',
          comparativeAnalysis: 'Slight edge to A.',
        };
      }
      return {
        candidateAScores: { reasoningQuality: 8.0, completeness: 8.0, robustness: 8.0, actionability: 8.0, rationale: 'A' },
        candidateBScores: { reasoningQuality: 8.6, completeness: 8.6, robustness: 8.6, actionability: 8.6, rationale: 'B' },
        winner: 'CANDIDATE_B',
        margin: 'SLIGHT',
        comparativeAnalysis: 'B wins 2 to 1.',
      };
    });

    const judge = new LLMJudge(mock);
    const ensemble = await judge.evaluateWithMultiJudgeEnsemble(samplePairContext, 3);

    expect(ensemble.consensusWinner).toBe('CANDIDATE_B');
    // 2 out of 3 agreed on B -> 2/3 = 0.67
    expect(ensemble.interJudgeAgreement).toBe(0.67);
  });
});
