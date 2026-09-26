import { describe, it, expect } from 'vitest';
import { withRetry, sanitizeJsonString, tryRepairTruncatedJson } from '../../src/providers/retry.utils.js';

describe('Retry & JSON Sanitization Utilities', () => {
  it('should return result immediately on successful execution', async () => {
    let calls = 0;
    const result = await withRetry(async () => {
      calls++;
      return 'success';
    });

    expect(result).toBe('success');
    expect(calls).toBe(1);
  });

  it('should retry on HTTP 429 rate limit errors and succeed', async () => {
    let calls = 0;
    const result = await withRetry(
      async () => {
        calls++;
        if (calls < 3) {
          const err = new Error('Resource exhausted / Rate limit exceeded');
          (err as any).status = 429;
          throw err;
        }
        return 'recovered';
      },
      { maxRetries: 3, initialDelayMs: 10, backoffFactor: 1.5 }
    );

    expect(result).toBe('recovered');
    expect(calls).toBe(3);
  });

  it('should fail after maxRetries is exceeded', async () => {
    let calls = 0;
    await expect(
      withRetry(
        async () => {
          calls++;
          const err = new Error('Service Unavailable');
          (err as any).status = 503;
          throw err;
        },
        { maxRetries: 2, initialDelayMs: 10 }
      )
    ).rejects.toThrow('Service Unavailable');

    expect(calls).toBe(3); // 1 initial + 2 retries
  });

  it('should not retry on non-retryable errors (e.g. 400 Bad Request)', async () => {
    let calls = 0;
    await expect(
      withRetry(
        async () => {
          calls++;
          const err = new Error('Invalid parameter');
          (err as any).status = 400;
          throw err;
        },
        { maxRetries: 3, initialDelayMs: 10 }
      )
    ).rejects.toThrow('Invalid parameter');

    expect(calls).toBe(1);
  });

  it('should correctly strip markdown code fences from JSON strings', () => {
    const rawWithFence = '```json\n{\n  "verdict": "APPROVE"\n}\n```';
    const sanitized = sanitizeJsonString(rawWithFence);
    expect(sanitized).toBe('{\n  "verdict": "APPROVE"\n}');
  });

  it('should extract JSON object surrounded by conversational filler text', () => {
    const rawWithFiller = 'Sure, here is the JSON output you requested:\n{"key": "value"}\nHope this helps!';
    const sanitized = sanitizeJsonString(rawWithFiller);
    expect(sanitized).toBe('{"key": "value"}');
  });

  it('should repair truncated JSON with open arrays, objects, and trailing keys', () => {
    const truncated = '{\n  "stance": "APPROVE",\n  "reasons": [\n    "Item 1",\n    "Item 2"\n  ],\n  "danglingKey":';
    const repaired = tryRepairTruncatedJson(truncated);
    const parsed = JSON.parse(repaired);
    expect(parsed.stance).toBe('APPROVE');
    expect(parsed.reasons).toEqual(['Item 1', 'Item 2']);

    const truncatedInArray = '{"items": [{"name": "A"}, {"name": "B"';
    const repaired2 = tryRepairTruncatedJson(truncatedInArray);
    const parsed2 = JSON.parse(repaired2);
    expect(parsed2.items).toHaveLength(2);
    expect(parsed2.items[0].name).toBe('A');
  });
});
