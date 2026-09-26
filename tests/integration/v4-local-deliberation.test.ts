import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLocalMagiSystem } from '../../src/routing/local-diversity.js';
import { resolvedInRoundOneFixtures } from '../../src/providers/mock/fixtures.js';

describe('V4.5 Integration — Zero-Cost Local Multi-Model Deliberation', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('runs complete deliberation cycle dispatching to orthogonal local models via Ollama', async () => {
    const requestedModels: string[] = [];

    // Mock Ollama /api/chat endpoint
    globalThis.fetch = vi.fn().mockImplementation(async (url: string, init: any) => {
      const body = JSON.parse(init.body);
      const model = body.model as string;
      requestedModels.push(model);

      const isSynthesis = body.messages.some((m: any) =>
        m.content?.includes('MagiSynthesisOutput') || m.content?.includes('synthesize') || body.format?.title === 'MagiSynthesisOutput'
      ) || init.body.includes('finalDecision');

      let responseContent: any;
      if (isSynthesis) {
        responseContent = resolvedInRoundOneFixtures.synthesis;
      } else if (model.includes('deepseek-r1') || body.messages.some((m: any) => m.content?.includes('MELCHIOR'))) {
        responseContent = resolvedInRoundOneFixtures.round0.MELCHIOR;
      } else if (model.includes('llama3.1') && body.messages.some((m: any) => m.content?.includes('BALTHASAR'))) {
        responseContent = resolvedInRoundOneFixtures.round0.BALTHASAR;
      } else if (model.includes('gemma2') || body.messages.some((m: any) => m.content?.includes('CASPER'))) {
        responseContent = resolvedInRoundOneFixtures.round0.CASPER;
      } else {
        responseContent = resolvedInRoundOneFixtures.round0.MELCHIOR;
      }

      return new Response(JSON.stringify({
        model,
        message: {
          role: 'assistant',
          content: JSON.stringify(responseContent),
        },
        prompt_eval_count: 120,
        eval_count: 85,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const localMagi = createLocalMagiSystem({
      preset: 'BALANCED_8B',
      host: 'http://localhost:11434',
    });

    const result = await localMagi.run('Should we migrate our storage layer to local NVMe SSDs?');

    expect(result).toBeDefined();
    expect(result.finalDecision).toBe('CONDITIONAL_PASS');
    expect(result.coreVerdict).toBeDefined();
    expect(result.deliberationRoundsCount).toBeGreaterThanOrEqual(1);

    // Verify heterogeneous routing across different model archetypes
    expect(requestedModels).toContain('deepseek-r1:8b'); // Melchior
    expect(requestedModels).toContain('llama3.1:8b');    // Balthasar / Core
    expect(requestedModels).toContain('gemma2:9b');       // Casper
  });
});
