import { describe, it, expect } from 'vitest';
import { createMagiSystem } from '../../src/index.js';
import { MockLanguageModelProvider } from '../../src/providers/mock/mock.provider.js';
import { resolvedInRoundOneFixtures } from '../../src/providers/mock/fixtures.js';
import { validateDeliberationInput } from '../../src/server/validator.js';

describe('Fast Deliberation Mode (Single-Round Rapid Synthesis)', () => {
  it('should skip deliberation rounds when maxDeliberationRounds is 0 (Fast Mode)', async () => {
    const mockProvider = new MockLanguageModelProvider();

    mockProvider.onGenerate(req => {
      if (req.schemaName === 'MagiSynthesisOutput') {
        return resolvedInRoundOneFixtures.synthesis;
      }

      if (req.systemInstruction?.includes('MELCHIOR-1')) {
        return resolvedInRoundOneFixtures.round0.MELCHIOR;
      }
      if (req.systemInstruction?.includes('BALTHASAR-2')) {
        return resolvedInRoundOneFixtures.round0.BALTHASAR;
      }
      if (req.systemInstruction?.includes('CASPER-3')) {
        return resolvedInRoundOneFixtures.round0.CASPER;
      }

      return undefined;
    });

    const stagesExecuted: string[] = [];
    const magi = createMagiSystem({
      provider: mockProvider,
      maxDeliberationRounds: 0, // Fast Mode
      hooks: {
        onRoundStart: (round) => stagesExecuted.push(`Start Round ${round}`),
        onDisagreementDetected: (round) => stagesExecuted.push(`Disagreement at Round ${round}`),
        onConsensusReached: (round) => stagesExecuted.push(`Consensus at Round ${round}`),
        onCoreSynthesisStart: () => stagesExecuted.push('Synthesis Start'),
      },
    });

    const result = await magi.run('Should we publish the project immediately or finish it first?');

    expect(result.finalDecision).toBe('CONDITIONAL_PASS');
    expect(result.deliberationRoundsCount).toBe(0);
    expect(result.rounds).toHaveLength(0);

    // Round 0 executed, but Round 1 was bypassed
    expect(stagesExecuted).toContain('Start Round 0');
    expect(stagesExecuted).toContain('Synthesis Start');
    expect(stagesExecuted).not.toContain('Start Round 1');
  });

  it('should correctly parse fastMode parameter in validateDeliberationInput', () => {
    const res1 = validateDeliberationInput({ question: 'Test question', fastMode: true });
    expect(res1.valid).toBe(true);
    if (res1.valid) {
      expect(res1.data.fastMode).toBe(true);
    }

    const res2 = validateDeliberationInput({ question: 'Test question', fastMode: false });
    expect(res2.valid).toBe(true);
    if (res2.valid) {
      expect(res2.data.fastMode).toBe(false);
    }

    const res3 = validateDeliberationInput({ question: 'Test question' });
    expect(res3.valid).toBe(true);
    if (res3.valid) {
      expect(res3.data.fastMode).toBe(false);
    }
  });
});
