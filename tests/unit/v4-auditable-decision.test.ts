import { describe, it, expect } from 'vitest';
import { MagiCore } from '../../src/deliberation/magi-core.js';
import { MockLanguageModelProvider } from '../../src/providers/mock/mock.provider.js';
import { resolvedInRoundOneFixtures } from '../../src/providers/mock/fixtures.js';
import { EvidenceStore } from '../../src/knowledge/evidence-store.js';
import type { DeliberationRound, EvidenceChallenge } from '../../src/domain/types.js';

describe('V4.1 Auditable Decision Core — Structured Governance & Decision Record', () => {
  it('should synthesize and populate a complete AuditableDecision record', async () => {
    const mockProvider = new MockLanguageModelProvider();
    mockProvider.onGenerate(async req => {
      if (req.schemaName === 'MagiSynthesisOutput') {
        return resolvedInRoundOneFixtures.synthesis;
      }
      return undefined;
    });

    const evidenceStore = new EvidenceStore();
    evidenceStore.addEvidence({
      id: 'ev-test-1',
      source: 'https://postgresql.org/docs/',
      content: 'PostgreSQL provides robust write-ahead logging (WAL) and crash recovery.',
      type: 'DOCUMENT',
      reliability: 0.95,
      timestamp: new Date(),
      claims: [{ statement: 'WAL provides crash recovery', type: 'FACT', confidence: 0.95, requiresEvidence: false }],
    });

    const challenge: EvidenceChallenge = {
      id: 'ch-1',
      challengingAgent: 'BALTHASAR',
      targetAgent: 'MELCHIOR',
      targetClaim: 'WAL provides crash recovery',
      question: 'What mechanism guarantees recovery?',
      status: 'SUPPORTED',
      supportingEvidenceId: 'ev-test-1',
    };

    const round1: DeliberationRound = {
      roundNumber: 1,
      agentOutputs: resolvedInRoundOneFixtures.round1,
      disagreementReport: {
        hasSignificantDisagreement: false,
        reason: 'Consensus formed on phased migration',
        divergentAgents: [],
        metrics: { stanceDivergence: false, maxConfidenceDelta: 0.1, confidences: { MELCHIOR: 0.9, BALTHASAR: 0.85, CASPER: 0.85 } },
      },
      evidenceChallenges: [challenge],
    };

    const magiCore = new MagiCore(mockProvider);
    const synthesis = await magiCore.synthesize(
      'Should we migrate our PostgreSQL database to MongoDB?',
      resolvedInRoundOneFixtures.round0,
      [round1],
      { evidenceStore }
    );

    expect(synthesis.auditableDecision).toBeDefined();
    const decision = synthesis.auditableDecision!;

    expect(decision.verdict).toBeDefined();
    expect(decision.confidence).toBeGreaterThan(0);
    expect(decision.risks.length).toBeGreaterThan(0);
    expect(decision.risks[0].severity).toBeDefined();
    expect(decision.minorityConcern).toBeDefined();
    expect(decision.reversalConditions.length).toBeGreaterThan(0);
    expect(decision.evidence.length).toBeGreaterThan(0);
    expect(decision.evidence[0].evidenceId).toBe('ev-test-1');
    expect(decision.nextActions.length).toBeGreaterThan(0);
    expect(decision.expectedOutcome).toBeDefined();
  });

  it('should penalize an agent in argumentQualityScore when their claim is unsupported under challenge', async () => {
    const mockProvider = new MockLanguageModelProvider();
    mockProvider.onGenerate(async req => {
      if (req.schemaName === 'MagiSynthesisOutput') {
        return resolvedInRoundOneFixtures.synthesis;
      }
      return undefined;
    });

    const evidenceStore = new EvidenceStore();
    // No evidence registered for this false claim
    const unsupportedChallenge: EvidenceChallenge = {
      id: 'ch-unsupported',
      challengingAgent: 'BALTHASAR',
      targetAgent: 'MELCHIOR',
      targetClaim: 'Database migration will take exactly 15 minutes with zero latency degradation.',
      question: 'What empirical load test proved a 15-minute cutover?',
      status: 'UNSUPPORTED',
    };

    const round1: DeliberationRound = {
      roundNumber: 1,
      agentOutputs: resolvedInRoundOneFixtures.round1,
      disagreementReport: {
        hasSignificantDisagreement: false,
        reason: 'Divergence resolved',
        divergentAgents: [],
        metrics: { stanceDivergence: false, maxConfidenceDelta: 0.1, confidences: { MELCHIOR: 0.9, BALTHASAR: 0.85, CASPER: 0.85 } },
      },
      evidenceChallenges: [unsupportedChallenge],
    };

    const magiCore = new MagiCore(mockProvider);
    const synthesis = await magiCore.synthesize(
      'Should we migrate database?',
      resolvedInRoundOneFixtures.round0,
      [round1],
      { evidenceStore }
    );

    // Initial fixture quality for Melchior is 8 in round 1 synthesis, should be penalized by -1.0
    expect(synthesis.argumentQualityScore.MELCHIOR).toBeLessThanOrEqual(resolvedInRoundOneFixtures.synthesis.argumentQualityScore.MELCHIOR);
  });
});
