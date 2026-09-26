import { describe, it, expect } from 'vitest';
import { GeminiProvider } from '../../src/providers/gemini/gemini.provider.js';
import { MockLanguageModelProvider } from '../../src/providers/mock/mock.provider.js';
import { createMagiSystem } from '../../src/index.js';
import { MagiProviderError } from '../../src/domain/errors.js';
import type { IDisagreementDetector } from '../../src/deliberation/disagreement-detector.interface.js';
import type { DisagreementReport } from '../../src/domain/types.js';
import { instantConsensusFixtures } from '../../src/providers/mock/fixtures.js';

describe('Resilience & Extensibility', () => {
  it('should throw clear MagiProviderError when Gemini API key is missing', async () => {
    // Force unconfigured key
    const provider = new GeminiProvider({ apiKey: '' });
    
    await expect(
      provider.generateStructured({
        messages: [{ role: 'user', content: 'test' }],
        schema: null as any,
        schemaName: 'test',
      })
    ).rejects.toThrowError(MagiProviderError);
  });

  it('should allow plugging in a custom IDisagreementDetector without changing the pipeline', async () => {
    // Custom detector that always forces consensus
    class AlwaysConsensusDetector implements IDisagreementDetector {
      evaluate(): DisagreementReport {
        return {
          hasSignificantDisagreement: false,
          reason: 'Forced consensus by custom detector module',
          divergentAgents: [],
          metrics: {
            stanceDivergence: false,
            maxConfidenceDelta: 0,
            confidences: { MELCHIOR: 1, BALTHASAR: 1, CASPER: 1 },
          },
        };
      }
    }

    const mockProvider = new MockLanguageModelProvider();
    // Register initial responses with wildly different stances
    mockProvider.registerResponse('MELCHIOR', {
      ...instantConsensusFixtures.initial.MELCHIOR,
      stance: 'APPROVE',
    });
    mockProvider.registerResponse('BALTHASAR', {
      ...instantConsensusFixtures.initial.BALTHASAR,
      stance: 'REJECT',
    });
    mockProvider.registerResponse('CASPER', {
      ...instantConsensusFixtures.initial.CASPER,
      stance: 'PIVOT',
    });
    mockProvider.registerResponse('MagiSynthesisOutput', instantConsensusFixtures.synthesis);

    const magi = createMagiSystem({
      provider: mockProvider,
      disagreementDetector: new AlwaysConsensusDetector(), // Pluggable custom detector!
    });

    const result = await magi.run('Test question');

    // Because custom detector returned no disagreement, deliberation was bypassed
    expect(result.deliberationRoundsCount).toBe(0);
    expect(mockProvider.callHistory).toHaveLength(4); // 3 agents + 1 core
  });
});
