import { describe, it, expect } from 'vitest';
import { MelchiorAgent } from '../../src/agents/melchior.agent.js';
import { BalthasarAgent } from '../../src/agents/balthasar.agent.js';
import { CasperAgent } from '../../src/agents/casper.agent.js';
import { MockLanguageModelProvider } from '../../src/providers/mock/mock.provider.js';
import { instantConsensusFixtures } from '../../src/providers/mock/fixtures.js';

describe('Agent Persona & Prompt Architecture', () => {
  it('should configure distinct identities and temperatures for each agent', () => {
    const mockProvider = new MockLanguageModelProvider();
    const melchior = new MelchiorAgent(mockProvider);
    const balthasar = new BalthasarAgent(mockProvider);
    const casper = new CasperAgent(mockProvider);

    expect(melchior.id).toBe('MELCHIOR');
    expect(balthasar.id).toBe('BALTHASAR');
    expect(casper.id).toBe('CASPER');

    expect(melchior.roleDescription).toContain('Analytical');
    expect(balthasar.roleDescription).toContain('Critical');
    expect(casper.roleDescription).toContain('Alternative');
  });

  it('should format peer critique prompts correctly during deliberation', async () => {
    const mockProvider = new MockLanguageModelProvider();
    mockProvider.registerResponse('MELCHIOR', instantConsensusFixtures.initial.MELCHIOR);

    const melchior = new MelchiorAgent(mockProvider);

    await melchior.deliberate('Should we use CI/CD?', 1, instantConsensusFixtures.initial);

    expect(mockProvider.callHistory).toHaveLength(1);
    const request = mockProvider.callHistory[0];

    expect(request.systemInstruction).toContain('MELCHIOR-1');
    expect(request.systemInstruction).toContain('DELIBERATION ROUND 1');
    expect(request.messages[0].content).toContain('PEER: BALTHASAR');
    expect(request.messages[0].content).toContain('PEER: CASPER');
    expect(request.messages[0].content).toContain('YOUR PREVIOUS STANCE');
  });
});
