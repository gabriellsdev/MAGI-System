import { describe, it, expect } from 'vitest';
import { createMagiSystem } from '../../src/index.js';
import { MockLanguageModelProvider } from '../../src/providers/mock/mock.provider.js';
import { instantConsensusFixtures } from '../../src/providers/mock/fixtures.js';

describe('Structured JSON Output & Execution Metadata', () => {
  it('should generate complete execution metadata attached to MagiSynthesisResult', async () => {
    const mockProvider = new MockLanguageModelProvider();
    mockProvider.registerResponse('MELCHIOR', instantConsensusFixtures.initial.MELCHIOR);
    mockProvider.registerResponse('BALTHASAR', instantConsensusFixtures.initial.BALTHASAR);
    mockProvider.registerResponse('CASPER', instantConsensusFixtures.initial.CASPER);
    mockProvider.registerResponse('MagiSynthesisOutput', instantConsensusFixtures.synthesis);

    const magi = createMagiSystem({
      provider: mockProvider,
      model: 'gemini-2.5-pro',
    });

    const result = await magi.run('Devemos adotar pipelines CI/CD automatizados?');

    expect(result.metadata).toBeDefined();
    expect(result.metadata?.provider).toBe('mock');
    expect(result.metadata?.model).toBe('gemini-2.5-pro');
    expect(result.metadata?.language).toBe('Portuguese');
    expect(result.metadata?.durationMs).toBeGreaterThanOrEqual(0);
    expect(new Date(result.metadata!.timestamp).getTime()).not.toBeNaN();

    // Verify clean JSON serialization
    const serialized = JSON.stringify(result);
    const parsed = JSON.parse(serialized);

    expect(parsed.finalDecision).toBe('CONSENSUS_REACHED');
    expect(parsed.metadata.language).toBe('Portuguese');
    expect(parsed.argumentQualityScore.MELCHIOR).toBe(9);
  });
});
