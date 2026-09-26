import { describe, it, expect } from 'vitest';
import { createMagiSystem } from '../../src/index.js';
import { MockLanguageModelProvider } from '../../src/providers/mock/mock.provider.js';
import { resolvedInRoundOneFixtures } from '../../src/providers/mock/fixtures.js';
import { EvidenceStore } from '../../src/knowledge/evidence-store.js';
import type { EvidenceChallenge } from '../../src/domain/types.js';

describe('V4.1 Integration — Evidence-Based Deliberation & Peer Challenges', () => {
  it('should run multi-agent deliberation with peer challenges and audit them against EvidenceStore', async () => {
    const evidenceStore = new EvidenceStore();
    evidenceStore.addEvidence({
      id: 'ev-arch-1',
      source: 'RFC-409.md',
      content: 'Strangler Fig pattern permits incremental microservice extraction with zero downtime.',
      type: 'DOCUMENT',
      reliability: 0.95,
      timestamp: new Date(),
      claims: [
        { statement: 'Strangler Fig allows incremental extraction', type: 'FACT', confidence: 0.95, requiresEvidence: false },
      ],
    });

    const mockChallenge: EvidenceChallenge = {
      id: 'ch-balthasar-vs-melchior',
      challengingAgent: 'BALTHASAR',
      targetAgent: 'MELCHIOR',
      targetClaim: 'Strangler Fig allows incremental extraction',
      question: 'What architectural standard validates that Strangler Fig avoids downtime?',
      status: 'PENDING',
    };

    const mockProvider = new MockLanguageModelProvider();
    mockProvider.onGenerate(async req => {
      if (req.schemaName === 'MagiSynthesisOutput') {
        return resolvedInRoundOneFixtures.synthesis;
      }
      if (req.systemInstruction?.includes('MELCHIOR')) {
        return resolvedInRoundOneFixtures.round0.MELCHIOR;
      }
      if (req.systemInstruction?.includes('BALTHASAR')) {
        // Balthasar issues an evidence challenge during deliberation
        return {
          ...resolvedInRoundOneFixtures.round0.BALTHASAR,
          evidenceChallenges: [mockChallenge],
        };
      }
      if (req.systemInstruction?.includes('CASPER')) {
        return resolvedInRoundOneFixtures.round0.CASPER;
      }
      return undefined;
    });

    const deliberationEngine = createMagiSystem({
      provider: mockProvider,
    });

    // Run deliberation with the evidence store passed
    const result = await deliberationEngine.run('Should we rewrite our backend architecture?', {
      evidenceStore,
    });

    expect(result.finalDecision).toBeDefined();
    expect(result.auditableDecision).toBeDefined();
    expect(result.auditableDecision!.verdict).toBeDefined();
    expect(result.auditableDecision!.evidence.length).toBeGreaterThan(0);
    expect(result.auditableDecision!.evidence[0].evidenceId).toBe('ev-arch-1');

    // If rounds occurred, verify that evidenceChallenges were recorded
    if (result.rounds.length > 0) {
      const allRoundsChallenges = result.rounds.flatMap(r => r.evidenceChallenges || []);
      expect(allRoundsChallenges.length).toBeGreaterThan(0);
      expect(allRoundsChallenges[0].status).toBe('SUPPORTED');
    }
  });
});
