import { describe, it, expect } from 'vitest';
import { createMagiSystem } from '../../src/index.js';
import { MockLanguageModelProvider } from '../../src/providers/mock/mock.provider.js';
import { getThematicFixture } from '../../src/providers/mock/fixtures.js';

describe('V3 Stage: Model Diversity & Multi-Provider Architecture', () => {
  it('should support heterogeneous models per agent in the Triad', async () => {
    const fixture = getThematicFixture('rust');

    const melchiorMock = new MockLanguageModelProvider();
    melchiorMock.onGenerate(() => ((fixture as any).round0 || (fixture as any).initial).MELCHIOR);

    const balthasarMock = new MockLanguageModelProvider();
    balthasarMock.onGenerate(() => ((fixture as any).round0 || (fixture as any).initial).BALTHASAR);

    const casperMock = new MockLanguageModelProvider();
    casperMock.onGenerate(() => ((fixture as any).round0 || (fixture as any).initial).CASPER);

    const coreMock = new MockLanguageModelProvider();
    coreMock.onGenerate(() => fixture.synthesis);

    const magi = createMagiSystem({
      provider: coreMock,
      agentProviders: {
        MELCHIOR: melchiorMock,
        BALTHASAR: balthasarMock,
        CASPER: casperMock,
      },
      agentModels: {
        MELCHIOR: 'gemini-2.5-pro',
        BALTHASAR: 'gemini-3.1-pro-preview',
        CASPER: 'gemini-2.5-flash',
      },
    });

    const result = await magi.run('Should we rewrite our backend services in Rust?');

    expect(result).toBeDefined();
    expect(result.finalDecision).toBeTruthy();
    expect(result.initialAnalysis.MELCHIOR).toBeDefined();
    expect(result.initialAnalysis.BALTHASAR).toBeDefined();
    expect(result.initialAnalysis.CASPER).toBeDefined();

    // Verify each independent provider was called
    expect(melchiorMock.callHistory.length).toBeGreaterThanOrEqual(1);
    expect(balthasarMock.callHistory.length).toBeGreaterThanOrEqual(1);
    expect(casperMock.callHistory.length).toBeGreaterThanOrEqual(1);
  });
});
