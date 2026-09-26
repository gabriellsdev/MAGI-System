import { describe, it, expect } from 'vitest';
import { createMagiSystem } from '../../src/index.js';
import { MockLanguageModelProvider } from '../../src/providers/mock/mock.provider.js';
import { persistentDeadlockFixtures } from '../../src/providers/mock/fixtures.js';

describe('Integration: Persistent Deadlock (Strict 2-Round Max Cap)', () => {
  it('should enforce hard cap at 2 deliberation rounds when deadlock persists, and let MAGI Core resolve it', async () => {
    const mockProvider = new MockLanguageModelProvider();

    mockProvider.onGenerate(req => {
      if (req.schemaName === 'MagiSynthesisOutput') {
        return persistentDeadlockFixtures.synthesis;
      }

      const isRound1 = req.systemInstruction?.includes('DELIBERATION ROUND 1');
      const isRound2 = req.systemInstruction?.includes('DELIBERATION ROUND 2');

      if (req.systemInstruction?.includes('MELCHIOR-1')) {
        if (isRound2) return persistentDeadlockFixtures.round2.MELCHIOR;
        if (isRound1) return persistentDeadlockFixtures.round1.MELCHIOR;
        return persistentDeadlockFixtures.round0.MELCHIOR;
      }
      if (req.systemInstruction?.includes('BALTHASAR-2')) {
        if (isRound2) return persistentDeadlockFixtures.round2.BALTHASAR;
        if (isRound1) return persistentDeadlockFixtures.round1.BALTHASAR;
        return persistentDeadlockFixtures.round0.BALTHASAR;
      }
      if (req.systemInstruction?.includes('CASPER-3')) {
        if (isRound2) return persistentDeadlockFixtures.round2.CASPER;
        if (isRound1) return persistentDeadlockFixtures.round1.CASPER;
        return persistentDeadlockFixtures.round0.CASPER;
      }

      return undefined;
    });

    const stagesExecuted: string[] = [];
    const magi = createMagiSystem({
      provider: mockProvider,
      hooks: {
        onRoundStart: (round, title) => stagesExecuted.push(`Start Round ${round}`),
        onDisagreementDetected: (round) => stagesExecuted.push(`Disagreement at Round ${round}`),
        onCoreSynthesisStart: () => stagesExecuted.push('Synthesis Start'),
      },
    });

    const result = await magi.run('Deploy high-risk experimental algorithm to global fleet?');

    // Deadlock checks
    expect(result.finalDecision).toBe('DEADLOCK_RESOLVED');
    expect(result.deliberationRoundsCount).toBe(2);
    expect(result.rounds).toHaveLength(2);
    expect(result.rounds[0].roundNumber).toBe(1);
    expect(result.rounds[1].roundNumber).toBe(2);

    // Verify MAGI Core weighted Balthasar's risk veto over majority vote
    expect(result.argumentQualityScore.BALTHASAR).toBe(10);
    expect(result.coreVerdict).toContain('existential risk veto');

    // Verify stage lifecycle: exactly Round 0, Round 1, Round 2, Synthesis
    expect(stagesExecuted).toEqual([
      'Start Round 0',
      'Disagreement at Round 0',
      'Start Round 1',
      'Disagreement at Round 1',
      'Start Round 2',
      'Disagreement at Round 2',
      'Synthesis Start',
    ]);

    // Hard cap: exactly 10 calls total (3 + 3 + 3 + 1), never 13 or infinite
    expect(mockProvider.callHistory).toHaveLength(10);
  });
});
