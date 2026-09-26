import { describe, it, expect } from 'vitest';
import { createMagiSystem } from '../../src/index.js';
import { MockLanguageModelProvider } from '../../src/providers/mock/mock.provider.js';
import { instantConsensusFixtures } from '../../src/providers/mock/fixtures.js';

describe('Integration: Instant Consensus (Round 0 Bypass)', () => {
  it('should immediately synthesize and bypass deliberation when all agents agree in Round 0', async () => {
    const mockProvider = new MockLanguageModelProvider();

    // Register initial responses and synthesis output
    mockProvider.registerResponse('MELCHIOR', instantConsensusFixtures.initial.MELCHIOR);
    mockProvider.registerResponse('BALTHASAR', instantConsensusFixtures.initial.BALTHASAR);
    mockProvider.registerResponse('CASPER', instantConsensusFixtures.initial.CASPER);
    mockProvider.registerResponse('MagiSynthesisOutput', instantConsensusFixtures.synthesis);

    const stagesExecuted: string[] = [];
    const magi = createMagiSystem({
      provider: mockProvider,
      hooks: {
        onRoundStart: (round, title) => stagesExecuted.push(`Round ${round}: ${title}`),
        onConsensusReached: (round) => stagesExecuted.push(`Consensus at Round ${round}`),
        onCoreSynthesisStart: () => stagesExecuted.push('Synthesis Start'),
      },
    });

    const result = await magi.run('Should we implement automated CI/CD pipelines?');

    // Verification
    expect(result.finalDecision).toBe('CONSENSUS_REACHED');
    expect(result.deliberationRoundsCount).toBe(0);
    expect(result.rounds).toHaveLength(0);
    expect(result.coreVerdict).toContain('Unanimous consensus');
    expect(result.argumentQualityScore.MELCHIOR).toBeGreaterThanOrEqual(8);

    // Ensure Round 1 and Round 2 were NEVER executed
    expect(stagesExecuted.some(s => s.startsWith('Round 0: Initial Independent Analysis'))).toBe(true);
    expect(stagesExecuted).toContain('Consensus at Round 0');
    expect(stagesExecuted).toContain('Synthesis Start');
    expect(stagesExecuted.some(s => s.includes('Round 1'))).toBe(false);
    expect(stagesExecuted.some(s => s.includes('Round 2'))).toBe(false);

    // Total LLM calls: 3 (Round 0 agents) + 1 (MAGI Core) = 4 calls
    expect(mockProvider.callHistory).toHaveLength(4);
  });
});
