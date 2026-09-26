import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { OpenAiCompatibleProvider } from '../../src/providers/openai-compatible/openai-compatible.provider.js';
import { MagiProviderError, MagiValidationError } from '../../src/domain/errors.js';

describe('OpenAiCompatibleProvider (V4.5 Generic / Groq Provider)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const testSchema = z.object({
    verdict: z.string(),
    riskLevel: z.string(),
  });

  it('initializes with custom baseUrl, apiKey, and providerId', () => {
    const provider = new OpenAiCompatibleProvider({
      baseUrl: 'https://api.groq.com/openai/v1/',
      apiKey: 'gsk-testkey123',
      providerId: 'groq-free-tier',
      defaultModel: 'llama-3.3-70b-versatile',
    });

    expect(provider.providerId).toBe('groq-free-tier');
    expect(provider.baseUrl).toBe('https://api.groq.com/openai/v1');
    expect(provider.defaultModel).toBe('llama-3.3-70b-versatile');
  });

  it('sends correct headers and JSON payload to /chat/completions', async () => {
    const provider = new OpenAiCompatibleProvider({
      baseUrl: 'https://api.groq.com/openai/v1',
      apiKey: 'gsk-testkey123',
      defaultModel: 'deepseek-r1-distill-llama-70b',
    });

    let capturedUrl = '';
    let capturedHeaders: Record<string, string> = {};
    let capturedBody: any = null;

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, init: any) => {
      capturedUrl = url;
      capturedHeaders = init.headers;
      capturedBody = JSON.parse(init.body);
      return new Response(JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({ verdict: 'APPROVE', riskLevel: 'LOW' }),
            },
          },
        ],
        usage: {
          prompt_tokens: 110,
          completion_tokens: 45,
          total_tokens: 155,
        },
      }), { status: 200 });
    });

    const result = await provider.generateStructured({
      model: 'deepseek-r1-distill-llama-70b',
      systemInstruction: 'Act as Melchior.',
      messages: [{ role: 'user', content: 'Audit plan.' }],
      schema: testSchema,
      schemaName: 'TestAudit',
      config: { temperature: 0.3 },
    });

    expect(capturedUrl).toBe('https://api.groq.com/openai/v1/chat/completions');
    expect(capturedHeaders['Authorization']).toBe('Bearer gsk-testkey123');
    expect(capturedHeaders['Content-Type']).toBe('application/json');
    expect(capturedBody.model).toBe('deepseek-r1-distill-llama-70b');
    expect(capturedBody.response_format).toEqual({ type: 'json_object' });
    expect(capturedBody.messages[0].role).toBe('system');
    expect(capturedBody.messages[0].content).toContain('Act as Melchior.');
    expect(capturedBody.messages[0].content).toContain('valid JSON object');

    expect(result.data.verdict).toBe('APPROVE');
    expect(result.data.riskLevel).toBe('LOW');
    expect(result.usage.promptTokens).toBe(110);
    expect(result.usage.completionTokens).toBe(45);
    expect(result.usage.totalTokens).toBe(155);
  });

  it('handles server errors from OpenAI-compatible endpoints', async () => {
    const provider = new OpenAiCompatibleProvider({
      baseUrl: 'https://api.groq.com/openai/v1',
      maxRetries: 0,
    });

    globalThis.fetch = vi.fn().mockImplementation(() => Promise.resolve(new Response('Rate limit reached', {
      status: 429,
      statusText: 'Too Many Requests',
    })));

    await expect(provider.generateStructured({
      schema: testSchema,
      schemaName: 'TestAudit',
      messages: [{ role: 'user', content: 'Audit plan.' }],
    })).rejects.toThrow(MagiProviderError);
  });

  it('throws MagiValidationError when completion is not valid JSON according to schema', async () => {
    const provider = new OpenAiCompatibleProvider({
      baseUrl: 'https://api.groq.com/openai/v1',
      maxRetries: 0,
    });

    globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: '{"verdict": 123}' } }], // verdict should be string, riskLevel is missing
    }), { status: 200 }));

    await expect(provider.generateStructured({
      schema: testSchema,
      schemaName: 'TestAudit',
      messages: [{ role: 'user', content: 'Audit plan.' }],
    })).rejects.toThrow();
  });
});
