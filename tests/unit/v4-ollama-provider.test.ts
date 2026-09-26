import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { OllamaLanguageModelProvider } from '../../src/providers/ollama/ollama.provider.js';
import { checkOllamaHealth } from '../../src/providers/ollama/ollama-health.js';
import { MagiProviderError, MagiValidationError } from '../../src/domain/errors.js';

describe('OllamaLanguageModelProvider (V4.5 Local Provider)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const testSchema = z.object({
    verdict: z.string(),
    confidence: z.number(),
    reason: z.string(),
  });

  it('initializes with default options and normalizes host URL', () => {
    const provider = new OllamaLanguageModelProvider({
      host: 'http://localhost:11434/',
      defaultModel: 'deepseek-r1:8b',
    });

    expect(provider.providerId).toBe('ollama');
    expect(provider.host).toBe('http://localhost:11434');
    expect(provider.defaultModel).toBe('deepseek-r1:8b');
  });

  it('successfully generates structured output with native JSON Schema and tracks token usage', async () => {
    const provider = new OllamaLanguageModelProvider({
      host: 'http://localhost:11434',
      defaultModel: 'llama3.1:8b',
    });

    const mockResponsePayload = {
      model: 'llama3.1:8b',
      message: {
        role: 'assistant',
        content: JSON.stringify({
          verdict: 'APPROVE',
          confidence: 0.92,
          reason: 'Solid technical rationale',
        }),
      },
      prompt_eval_count: 140,
      eval_count: 65,
    };

    let capturedUrl = '';
    let capturedBody: any = null;

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, init: any) => {
      capturedUrl = url;
      capturedBody = JSON.parse(init.body);
      return new Response(JSON.stringify(mockResponsePayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const result = await provider.generateStructured({
      model: 'llama3.1:8b',
      systemInstruction: 'You are Melchior.',
      messages: [{ role: 'user', content: 'Evaluate architecture.' }],
      schema: testSchema,
      schemaName: 'TestEvaluation',
      config: { temperature: 0.1 },
    });

    expect(capturedUrl).toBe('http://localhost:11434/api/chat');
    expect(capturedBody.model).toBe('llama3.1:8b');
    expect(capturedBody.messages).toHaveLength(2);
    expect(capturedBody.messages[0]).toEqual({ role: 'system', content: 'You are Melchior.' });
    expect(capturedBody.messages[1]).toEqual({ role: 'user', content: 'Evaluate architecture.' });
    expect(capturedBody.format).toBeDefined();
    expect(capturedBody.options.temperature).toBe(0.1);

    expect(result.data.verdict).toBe('APPROVE');
    expect(result.data.confidence).toBe(0.92);
    expect(result.usage.promptTokens).toBe(140);
    expect(result.usage.completionTokens).toBe(65);
    expect(result.usage.totalTokens).toBe(205);
  });

  it('handles markdown wrapped JSON responses via sanitization', async () => {
    const provider = new OllamaLanguageModelProvider({
      host: 'http://localhost:11434',
      defaultModel: 'llama3.1:8b',
    });

    const markdownJson = `\`\`\`json\n{"verdict": "REJECT", "confidence": 0.88, "reason": "High risk"}\n\`\`\``;

    globalThis.fetch = vi.fn().mockImplementation(async () => {
      return new Response(JSON.stringify({
        message: { content: markdownJson },
        prompt_eval_count: 50,
        eval_count: 20,
      }), { status: 200 });
    });

    const result = await provider.generateStructured({
      schema: testSchema,
      schemaName: 'TestEvaluation',
      messages: [{ role: 'user', content: 'Analyze' }],
    });

    expect(result.data.verdict).toBe('REJECT');
    expect(result.data.confidence).toBe(0.88);
  });

  it('throws MagiProviderError with actionable instructions when daemon is offline', async () => {
    const provider = new OllamaLanguageModelProvider({
      host: 'http://localhost:11434',
      maxRetries: 0,
    });

    globalThis.fetch = vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:11434'));

    await expect(provider.generateStructured({
      schema: testSchema,
      schemaName: 'TestEvaluation',
      messages: [{ role: 'user', content: 'Analyze' }],
    })).rejects.toThrow(MagiProviderError);

    await expect(provider.generateStructured({
      schema: testSchema,
      schemaName: 'TestEvaluation',
      messages: [{ role: 'user', content: 'Analyze' }],
    })).rejects.toThrow(/Ensure Ollama is running locally/);
  });

  it('throws MagiProviderError indicating missing model when Ollama returns 404', async () => {
    const provider = new OllamaLanguageModelProvider({
      host: 'http://localhost:11434',
      maxRetries: 0,
    });

    globalThis.fetch = vi.fn().mockResolvedValue(new Response('model "deepseek-r1:8b" not found', {
      status: 404,
      statusText: 'Not Found',
    }));

    await expect(provider.generateStructured({
      model: 'deepseek-r1:8b',
      schema: testSchema,
      schemaName: 'TestEvaluation',
      messages: [{ role: 'user', content: 'Analyze' }],
    })).rejects.toThrow(/Please install it using: 'ollama pull deepseek-r1:8b'/);
  });

  it('throws MagiValidationError when response JSON cannot be parsed or validated', async () => {
    const provider = new OllamaLanguageModelProvider({
      host: 'http://localhost:11434',
      maxRetries: 0,
    });

    globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      message: { content: 'not valid json' },
    }), { status: 200 }));

    await expect(provider.generateStructured({
      schema: testSchema,
      schemaName: 'TestEvaluation',
      messages: [{ role: 'user', content: 'Analyze' }],
    })).rejects.toThrow(MagiValidationError);
  });
});

describe('checkOllamaHealth (Ollama Daemon Inspection)', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns available true and lists models when daemon responds', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      models: [
        { name: 'llama3.1:8b' },
        { name: 'deepseek-r1:8b' },
        { name: 'gemma2:9b' },
      ],
    }), { status: 200 }));

    const health = await checkOllamaHealth('http://localhost:11434');
    expect(health.available).toBe(true);
    expect(health.models).toEqual(['llama3.1:8b', 'deepseek-r1:8b', 'gemma2:9b']);
    expect(health.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('returns available false and error message when daemon is unreachable', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

    const health = await checkOllamaHealth('http://localhost:11434');
    expect(health.available).toBe(false);
    expect(health.models).toEqual([]);
    expect(health.error).toContain('Connection refused');
  });
});
