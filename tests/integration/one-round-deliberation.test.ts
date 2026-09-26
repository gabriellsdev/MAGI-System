import { describe, it, expect } from 'vitest';
import { createMagiSystem } from '../../src/index.js';
import { MockLanguageModelProvider } from '../../src/providers/mock/mock.provider.js';
import { resolvedInRoundOneFixtures } from '../../src/providers/mock/fixtures.js';

describe('Integration: One Round Deliberation Resolution', () => {
  it('should deliberate for 1 round when initial disagreement resolves after peer critique', async () => {
    const mockProvider = new MockLanguageModelProvider();

    // Map responses dynamically based on round or content
    mockProvider.onGenerate(req => {
      if (req.schemaName === 'MagiSynthesisOutput') {
        return resolvedInRoundOneFixtures.synthesis;
      }

      const isRound1 = req.systemInstruction?.includes('DELIBERATION ROUND 1');

      if (req.systemInstruction?.includes('MELCHIOR-1')) {
        return isRound1
          ? resolvedInRoundOneFixtures.round1.MELCHIOR
          : resolvedInRoundOneFixtures.round0.MELCHIOR;
      }
      if (req.systemInstruction?.includes('BALTHASAR-2')) {
        return isRound1
          ? resolvedInRoundOneFixtures.round1.BALTHASAR
          : resolvedInRoundOneFixtures.round0.BALTHASAR;
      }
      if (req.systemInstruction?.includes('CASPER-3')) {
        return isRound1
          ? resolvedInRoundOneFixtures.round1.CASPER
          : resolvedInRoundOneFixtures.round0.CASPER;
      }

      return undefined;
    });

    const stagesExecuted: string[] = [];
    const magi = createMagiSystem({
      provider: mockProvider,
      hooks: {
        onRoundStart: (round, title) => stagesExecuted.push(`Start Round ${round}`),
        onDisagreementDetected: (round, report) => stagesExecuted.push(`Disagreement at Round ${round}`),
        onConsensusReached: (round) => stagesExecuted.push(`Consensus at Round ${round}`),
        onCoreSynthesisStart: () => stagesExecuted.push('Synthesis Start'),
      },
    });

    const result = await magi.run('Should we rewrite all services in Rust?');

    expect(result.finalDecision).toBe('CONDITIONAL_PASS');
    expect(result.deliberationRoundsCount).toBe(1);
    expect(result.rounds).toHaveLength(1);
    expect(result.rounds[0].roundNumber).toBe(1);
    expect(result.rounds[0].disagreementReport.hasSignificantDisagreement).toBe(false);

    // Lifecycle transitions
    expect(stagesExecuted).toContain('Start Round 0');
    expect(stagesExecuted).toContain('Disagreement at Round 0');
    expect(stagesExecuted).toContain('Start Round 1');
    expect(stagesExecuted).toContain('Consensus at Round 1');
    expect(stagesExecuted).toContain('Synthesis Start');
    expect(stagesExecuted.some(s => s.includes('Round 2'))).toBe(false);

    // Total calls: 3 (Round 0) + 3 (Round 1) + 1 (Core) = 7
    expect(mockProvider.callHistory).toHaveLength(7);
  });
});
