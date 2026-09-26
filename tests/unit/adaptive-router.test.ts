import { describe, it, expect, beforeEach } from 'vitest';
import { AdaptiveRouter } from '../../src/routing/adaptive-router.js';
import { ObservabilityTracker } from '../../src/observability/observability-tracker.js';
import { MockLanguageModelProvider } from '../../src/providers/mock/mock.provider.js';
import { createMagiSystem } from '../../src/index.js';
import { getThematicFixture } from '../../src/providers/mock/fixtures.js';

describe('V3 Stage 5: Adaptive Routing & Observability Tracker', () => {
  let tracker: ObservabilityTracker;
  let mockProvider: MockLanguageModelProvider;

  beforeEach(() => {
    tracker = new ObservabilityTracker();
    mockProvider = new MockLanguageModelProvider();

    const fixture = getThematicFixture('microservices');
    mockProvider.onGenerate(req => {
      if (req.schemaName === 'ComplexityClassification') {
        return {
          complexity: 'LOW',
          reason: 'Simple factual query',
          riskLevel: 'LOW',
          recommendedRouting: 'FAST_PATH',
          confidence: 0.95,
        };
      }
      if (req.schemaName === 'SingleBaselineEvaluation') {
        return {
          summary: 'Fast-path concise answer.',
          pros: ['Direct and fast.'],
          cons: ['Standard caveats.'],
          verdict: 'Recommended path forward.',
        };
      }
      if (req.schemaName === 'MagiSynthesisOutput') {
        return fixture.synthesis;
      }
      return (fixture as any).initial.MELCHIOR;
    });
  });

  it('should classify high-risk architectural queries as HIGH complexity via heuristics', async () => {
    const deliberationEngine = createMagiSystem({ provider: mockProvider });
    const router = new AdaptiveRouter({
      provider: mockProvider,
      deliberationEngine,
      tracker,
      enableFastHeuristics: true,
    });

    const res = await router.classifyComplexity(
      'Should we migrate our core database architecture from monolith to microservices?'
    );

    expect(res.complexity).toBe('HIGH');
    expect(res.recommendedRouting).toBe('DEEP_DELIBERATION');
    expect(res.riskLevel).toBe('HIGH');
  });

  it('should classify simple factual queries as LOW complexity via heuristics', async () => {
    const deliberationEngine = createMagiSystem({ provider: mockProvider });
    const router = new AdaptiveRouter({
      provider: mockProvider,
      deliberationEngine,
      tracker,
      enableFastHeuristics: true,
    });

    const res = await router.classifyComplexity('What is an index in PostgreSQL?');

    expect(res.complexity).toBe('LOW');
    expect(res.recommendedRouting).toBe('FAST_PATH');
    expect(res.riskLevel).toBe('LOW');
  });

  it('should execute FAST_PATH for LOW complexity and record token/cost savings', async () => {
    const deliberationEngine = createMagiSystem({ provider: mockProvider });
    const router = new AdaptiveRouter({
      provider: mockProvider,
      deliberationEngine,
      tracker,
      enableFastHeuristics: true,
    });

    const result = await router.routeAndExecute('What is an index in PostgreSQL?');

    expect(result.routingMetadata.executionPathUsed).toBe('FAST_PATH');
    expect(result.routingMetadata.tokensSaved).toBeGreaterThan(0);
    expect(result.deliberationRoundsCount).toBe(0);
    expect(result.coreVerdict).toBe('Recommended path forward.');

    // Check tracker recorded the fast path
    const metrics = tracker.getMetrics();
    expect(metrics.totalQueries).toBe(1);
    expect(metrics.adaptiveRoutingStats.fastPathCount).toBe(1);
    expect(metrics.adaptiveRoutingStats.estimatedTokensSaved).toBeGreaterThan(0);
  });

  it('should track observability metrics across multiple executions', () => {
    const tracker = new ObservabilityTracker();

    tracker.recordExecution({
      question: 'Query 1',
      finalDecision: 'CONSENSUS_REACHED',
      coreVerdict: 'Verdict 1',
      argumentQualityScore: { MELCHIOR: 8, BALTHASAR: 8, CASPER: 8 },
      decisiveFactors: ['Factor 1'],
      synthesisSummary: 'Summary 1',
      dissentingOpinionsNoted: [],
      deliberationRoundsCount: 0,
      initialAnalysis: {} as any,
      rounds: [],
      totalTokensUsed: 1200,
      estimatedCostUsd: 0.003,
      metadata: { durationMs: 2500 } as any,
    });

    tracker.recordExecution({
      question: 'Query 2',
      finalDecision: 'DEADLOCK_RESOLVED',
      coreVerdict: 'Verdict 2',
      argumentQualityScore: { MELCHIOR: 9, BALTHASAR: 9, CASPER: 8 },
      decisiveFactors: ['Factor 2'],
      synthesisSummary: 'Summary 2',
      dissentingOpinionsNoted: ['Dissent'],
      deliberationRoundsCount: 2,
      initialAnalysis: {} as any,
      rounds: [
        {
          roundNumber: 1,
          agentOutputs: {} as any,
          disagreementReport: {
            hasSignificantDisagreement: true,
            reason: 'Divergence',
            divergentAgents: ['BALTHASAR'],
            metrics: {} as any,
            isFilteredByArbiter: false,
          },
        },
      ],
      totalTokensUsed: 4200,
      estimatedCostUsd: 0.011,
      metadata: { durationMs: 7800 } as any,
    });

    const metrics = tracker.getMetrics();
    expect(metrics.totalQueries).toBe(2);
    expect(metrics.consensusRate).toBe(50.0); // 1 out of 2 had 0 rounds
    expect(metrics.avgRounds).toBe(1.0);
    expect(metrics.avgLatencyMs).toBe(5150); // (2500 + 7800) / 2
    expect(metrics.totalTokensUsed).toBe(5400);
    expect(metrics.disagreementStats.structuralDisagreements).toBe(1);
    expect(metrics.disagreementStats.substantiveDisagreements).toBe(1);
  });
});
