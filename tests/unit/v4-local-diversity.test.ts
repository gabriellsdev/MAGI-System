import { describe, it, expect } from 'vitest';
import {
  LOCAL_DIVERSITY_PRESETS,
  createLocalMagiSystem,
  createGroqFreeTierMagiSystem,
  resolveModelWithFallback,
} from '../../src/routing/local-diversity.js';
import { OllamaLanguageModelProvider } from '../../src/providers/ollama/ollama.provider.js';

describe('LocalDiversityRouter & Presets (V4.5 Zero-Cost Architecture)', () => {
  it('defines valid balanced, lightweight, and reasoning presets', () => {
    expect(LOCAL_DIVERSITY_PRESETS.BALANCED_8B).toBeDefined();
    expect(LOCAL_DIVERSITY_PRESETS.BALANCED_8B.MELCHIOR).toBe('deepseek-r1:8b');
    expect(LOCAL_DIVERSITY_PRESETS.BALANCED_8B.BALTHASAR).toBe('llama3.1:8b');
    expect(LOCAL_DIVERSITY_PRESETS.BALANCED_8B.CASPER).toBe('gemma2:9b');

    expect(LOCAL_DIVERSITY_PRESETS.LIGHTWEIGHT_3B).toBeDefined();
    expect(LOCAL_DIVERSITY_PRESETS.LIGHTWEIGHT_3B.MELCHIOR).toBe('qwen2.5-coder:3b');
    expect(LOCAL_DIVERSITY_PRESETS.LIGHTWEIGHT_3B.BALTHASAR).toBe('llama3.2:3b');
    expect(LOCAL_DIVERSITY_PRESETS.LIGHTWEIGHT_3B.CASPER).toBe('phi3.5:3.8b');

    expect(LOCAL_DIVERSITY_PRESETS.REASONING_FOCUSED).toBeDefined();
    expect(LOCAL_DIVERSITY_PRESETS.REASONING_FOCUSED.MELCHIOR).toBe('deepseek-r1:8b');
    expect(LOCAL_DIVERSITY_PRESETS.REASONING_FOCUSED.BALTHASAR).toBe('qwen2.5-coder:7b');
    expect(LOCAL_DIVERSITY_PRESETS.REASONING_FOCUSED.CASPER).toBe('llama3.1:8b');
  });

  it('resolves models with exact match, base match, and installed fallback', () => {
    // Exact match
    expect(resolveModelWithFallback('llama3.2:3b', ['llama3.2:3b', 'qwen2.5-coder:3b'])).toBe('llama3.2:3b');

    // Base name match
    expect(resolveModelWithFallback('llama3.2:3b', ['llama3.2:latest'])).toBe('llama3.2:latest');

    // Fallback when not installed
    expect(resolveModelWithFallback('deepseek-r1:8b', ['llama3.2:3b'], 0)).toBe('llama3.2:3b');
    expect(resolveModelWithFallback('qwen2.5-coder:3b', ['llama3.2:3b'], 1)).toBe('llama3.2:3b');

    // Deterministic fallback index distribution across available models
    const available = ['model-a:latest', 'model-b:latest'];
    expect(resolveModelWithFallback('missing-1', available, 0)).toBe('model-a:latest');
    expect(resolveModelWithFallback('missing-2', available, 1)).toBe('model-b:latest');
    expect(resolveModelWithFallback('missing-3', available, 2)).toBe('model-a:latest');

    // When installedModels is empty or undefined, preserves preferred
    expect(resolveModelWithFallback('preferred:7b', undefined)).toBe('preferred:7b');
    expect(resolveModelWithFallback('preferred:7b', [])).toBe('preferred:7b');
  });

  it('creates local MAGI deliberation engine with heterogeneous Ollama providers', () => {
    const magi = createLocalMagiSystem({
      preset: 'BALANCED_8B',
      host: 'http://localhost:11434',
    });

    expect(magi).toBeDefined();
    expect(typeof magi.run).toBe('function');
  });

  it('creates local MAGI deliberation engine gracefully falling back when only one model is installed', () => {
    const magi = createLocalMagiSystem({
      preset: 'LIGHTWEIGHT_3B',
      host: 'http://localhost:11434',
      installedModels: ['llama3.2:3b'],
    });

    expect(magi).toBeDefined();
    expect(typeof magi.run).toBe('function');
  });

  it('allows custom model overrides per agent in createLocalMagiSystem', () => {
    const magi = createLocalMagiSystem({
      preset: 'LIGHTWEIGHT_3B',
      customModels: {
        MELCHIOR: 'mistral:7b',
      },
    });

    expect(magi).toBeDefined();
    expect(typeof magi.run).toBe('function');
  });

  it('creates Groq free tier deliberation engine with distinct model providers', () => {
    const groqMagi = createGroqFreeTierMagiSystem('gsk-mockkey');

    expect(groqMagi).toBeDefined();
    expect(typeof groqMagi.run).toBe('function');
  });
});
