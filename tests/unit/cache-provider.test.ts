import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { z } from 'zod';
import { CachedProvider } from '../../src/providers/cache/cached.provider.js';
import { MockLanguageModelProvider } from '../../src/providers/mock/mock.provider.js';
import type { StructuredGenerationRequest } from '../../src/providers/provider.interface.js';

describe('CachedProvider (V3 LLM Caching Layer)', () => {
  let tempDir: string;
  let mockInnerProvider: MockLanguageModelProvider;

  const testSchema = z.object({
    analysis: z.string(),
    confidence: z.number(),
  });

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'magi-cache-test-'));
    mockInnerProvider = new MockLanguageModelProvider();
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  });

  it('should compute deterministic SHA-256 cache keys', () => {
    const cachedProvider = new CachedProvider(mockInnerProvider, { cacheDir: tempDir });

    const req1: StructuredGenerationRequest<z.infer<typeof testSchema>> = {
      model: 'gemini-2.5-pro',
      systemInstruction: 'You are Melchior.',
      messages: [{ role: 'user', content: 'Should we migrate to Rust?' }],
      schema: testSchema,
      schemaName: 'TestOutput',
      config: { temperature: 0.2 },
    };

    const req2: StructuredGenerationRequest<z.infer<typeof testSchema>> = {
      model: 'gemini-2.5-pro',
      systemInstruction: 'You are Melchior.',
      messages: [{ role: 'user', content: 'Should we migrate to Rust?' }],
      schema: testSchema,
      schemaName: 'TestOutput',
      config: { temperature: 0.2 },
    };

    const reqDifferentPrompt: StructuredGenerationRequest<z.infer<typeof testSchema>> = {
      ...req1,
      messages: [{ role: 'user', content: 'Should we migrate to Go?' }],
    };

    const key1 = cachedProvider.computeCacheKey(req1);
    const key2 = cachedProvider.computeCacheKey(req2);
    const keyDiff = cachedProvider.computeCacheKey(reqDifferentPrompt);

    expect(key1).toBe(key2);
    expect(key1).not.toBe(keyDiff);
    expect(key1).toHaveLength(64); // SHA-256 hex length
  });

  it('should delegate to inner provider on cache miss and write to disk', async () => {
    let innerCallCount = 0;
    mockInnerProvider.onGenerate(() => {
      innerCallCount++;
      return { analysis: 'Generated analysis', confidence: 0.85 };
    });

    const cachedProvider = new CachedProvider(mockInnerProvider, { cacheDir: tempDir });

    const request: StructuredGenerationRequest<z.infer<typeof testSchema>> = {
      model: 'gemini-2.5-pro',
      systemInstruction: 'Analyze',
      messages: [{ role: 'user', content: 'Test prompt' }],
      schema: testSchema,
      schemaName: 'TestOutput',
    };

    const res = await cachedProvider.generateStructured(request);

    expect(innerCallCount).toBe(1);
    expect(res.data.analysis).toBe('Generated analysis');
    expect(cachedProvider.getStats().misses).toBe(1);
    expect(cachedProvider.getStats().hits).toBe(0);

    // Verify file exists on disk
    const key = cachedProvider.computeCacheKey(request);
    const filePath = path.join(tempDir, `${key}.json`);
    expect(fs.existsSync(filePath)).toBe(true);

    const saved = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(saved.key).toBe(key);
    expect(saved.response.data.analysis).toBe('Generated analysis');
  });

  it('should return cached response on subsequent identical calls without hitting inner provider', async () => {
    let innerCallCount = 0;
    mockInnerProvider.onGenerate(() => {
      innerCallCount++;
      return { analysis: 'Cached analysis', confidence: 0.9 };
    });

    const cachedProvider = new CachedProvider(mockInnerProvider, { cacheDir: tempDir });

    const request: StructuredGenerationRequest<z.infer<typeof testSchema>> = {
      model: 'gemini-2.5-pro',
      systemInstruction: 'Analyze',
      messages: [{ role: 'user', content: 'Repeat query' }],
      schema: testSchema,
      schemaName: 'TestOutput',
    };

    // First call: Miss
    const res1 = await cachedProvider.generateStructured(request);
    expect(innerCallCount).toBe(1);
    expect(res1.data.analysis).toBe('Cached analysis');

    // Second call: Hit
    const res2 = await cachedProvider.generateStructured(request);
    expect(innerCallCount).toBe(1); // Inner provider not called again
    expect(res2.data.analysis).toBe('Cached analysis');
    expect(cachedProvider.getStats().hits).toBe(1);
    expect(cachedProvider.getStats().misses).toBe(1);
  });

  it('should bypass cache when forceRefresh is true', async () => {
    let innerCallCount = 0;
    mockInnerProvider.onGenerate(() => {
      innerCallCount++;
      return { analysis: `Call #${innerCallCount}`, confidence: 0.8 };
    });

    const cachedProvider = new CachedProvider(mockInnerProvider, {
      cacheDir: tempDir,
      forceRefresh: true,
    });

    const request: StructuredGenerationRequest<z.infer<typeof testSchema>> = {
      model: 'gemini-2.5-pro',
      systemInstruction: 'Analyze',
      messages: [{ role: 'user', content: 'Bypass test' }],
      schema: testSchema,
      schemaName: 'TestOutput',
    };

    const res1 = await cachedProvider.generateStructured(request);
    const res2 = await cachedProvider.generateStructured(request);

    expect(innerCallCount).toBe(2);
    expect(res1.data.analysis).toBe('Call #1');
    expect(res2.data.analysis).toBe('Call #2');
    expect(cachedProvider.getStats().hits).toBe(0);
  });
});
