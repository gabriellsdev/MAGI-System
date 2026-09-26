import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  isVercelEnvironment,
  isModelSelectionLocked,
  verifyAdminKey,
  getEffectiveAdminKey,
  resolveEngineAndModel,
  createMagiRequestHandler,
} from '../../src/server/server.js';
import { validateDeliberationInput } from '../../src/server/validator.js';
import { resolveModelWithFallback } from '../../src/routing/local-diversity.js';
import http from 'node:http';

describe('Vercel Model Lock & Owner Controls', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.VERCEL;
    delete process.env.AWS_LAMBDA_FUNCTION_NAME;
    delete process.env.VERCEL_ENV;
    delete process.env.LOCK_MODEL;
    delete process.env.ADMIN_ACCESS_KEY;
    delete process.env.DEFAULT_MODEL;
    delete process.env.DEFAULT_ENGINE;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Environment & Lock Detection', () => {
    it('detects Vercel environment correctly', () => {
      expect(isVercelEnvironment()).toBe(false);

      process.env.VERCEL = '1';
      expect(isVercelEnvironment()).toBe(true);

      delete process.env.VERCEL;
      process.env.AWS_LAMBDA_FUNCTION_NAME = 'magi-fn';
      expect(isVercelEnvironment()).toBe(true);
    });

    it('locks model selection on Vercel by default', () => {
      process.env.VERCEL = '1';
      expect(isModelSelectionLocked()).toBe(true);
    });

    it('respects LOCK_MODEL override', () => {
      process.env.LOCK_MODEL = 'true';
      expect(isModelSelectionLocked()).toBe(true);

      process.env.VERCEL = '1';
      process.env.LOCK_MODEL = 'false';
      expect(isModelSelectionLocked()).toBe(false);
    });
  });

  describe('Operator Admin Authentication', () => {
    it('verifies admin key via header and body when configured', () => {
      process.env.ADMIN_ACCESS_KEY = 'secret-magi-key-42';

      const mockReqHeader = {
        headers: { 'x-admin-key': 'secret-magi-key-42' },
      } as unknown as http.IncomingMessage;

      const mockReqInvalid = {
        headers: { 'x-admin-key': 'wrong-key' },
      } as unknown as http.IncomingMessage;

      const mockReqNoHeader = {
        headers: {},
      } as unknown as http.IncomingMessage;

      expect(verifyAdminKey(mockReqHeader)).toBe(true);
      expect(verifyAdminKey(mockReqInvalid)).toBe(false);
      expect(verifyAdminKey(mockReqNoHeader, 'secret-magi-key-42')).toBe(true);
      expect(verifyAdminKey(mockReqNoHeader, 'wrong-body-key')).toBe(false);
    });

    it('falls back to default "admin" key when ADMIN_ACCESS_KEY is not explicitly set', () => {
      delete process.env.ADMIN_ACCESS_KEY;

      const mockReqDefault = {
        headers: { 'x-admin-key': 'admin' },
      } as unknown as http.IncomingMessage;

      const mockReqWrong = {
        headers: { 'x-admin-key': 'wrong-key' },
      } as unknown as http.IncomingMessage;

      expect(verifyAdminKey(mockReqDefault)).toBe(true);
      expect(verifyAdminKey(mockReqWrong)).toBe(false);
    });

    it('returns default admin key when env is unset, and custom key when set', () => {
      delete process.env.ADMIN_ACCESS_KEY;
      expect(getEffectiveAdminKey()).toBe('admin');

      process.env.ADMIN_ACCESS_KEY = 'super-secret';
      expect(getEffectiveAdminKey()).toBe('super-secret');
    });

    it('verifies admin key via query parameter as well', () => {
      delete process.env.ADMIN_ACCESS_KEY;
      const mockReqEmpty = { headers: {} } as unknown as http.IncomingMessage;

      expect(verifyAdminKey(mockReqEmpty, undefined, 'admin')).toBe(true);
      expect(verifyAdminKey(mockReqEmpty, undefined, 'wrong')).toBe(false);
    });
  });

  describe('Validator adminKey extraction', () => {
    it('parses adminKey in deliberation input', () => {
      const res = validateDeliberationInput({
        question: 'Should we adopt microservices architecture?',
        adminKey: 'test-admin-key',
      });

      expect(res.valid).toBe(true);
      if (res.valid) {
        expect(res.data.adminKey).toBe('test-admin-key');
      }
    });
  });

  describe('Local Diversity Routing with qwen2.5:7b and llama3.2:3b', () => {
    it('matches family keywords for qwen and llama models', () => {
      const installed = ['qwen2.5:7b', 'llama3.2:3b'];

      // Family matching for qwen
      expect(resolveModelWithFallback('qwen2.5-coder:7b', installed)).toBe('qwen2.5:7b');

      // Family matching for llama
      expect(resolveModelWithFallback('llama3.1:8b', installed)).toBe('llama3.2:3b');

      // Exact match
      expect(resolveModelWithFallback('qwen2.5:7b', installed)).toBe('qwen2.5:7b');
      expect(resolveModelWithFallback('llama3.2:3b', installed)).toBe('llama3.2:3b');
    });
  });

  describe('Public vs Operator Engine Resolution (resolveEngineAndModel)', () => {
    it('restricts public visitors on Vercel strictly to mock fixtures', () => {
      const isLocked = true;
      const isAdmin = false;

      const mockRes = resolveEngineAndModel('mock', undefined, isLocked, isAdmin);
      expect(mockRes.engine).toBe('mock');
      expect(mockRes.isMock).toBe(true);

      const groqRes = resolveEngineAndModel('groq-free', undefined, isLocked, isAdmin);
      expect(groqRes.engine).toBe('mock');
      expect(groqRes.isMock).toBe(true);

      const geminiRes = resolveEngineAndModel('gemini', undefined, isLocked, isAdmin);
      expect(geminiRes.engine).toBe('mock');
      expect(geminiRes.isMock).toBe(true);

      const flashRes = resolveEngineAndModel('gemini-flash', undefined, isLocked, isAdmin);
      expect(flashRes.engine).toBe('mock');
      expect(flashRes.isMock).toBe(true);

      const ollamaRes = resolveEngineAndModel('ollama-balanced', undefined, isLocked, isAdmin);
      expect(ollamaRes.engine).toBe('mock');
      expect(ollamaRes.isMock).toBe(true);
    });

    it('allows authenticated operator on Vercel to select advanced cloud models', () => {
      const isLocked = true;
      const isAdmin = true;

      const groqRes = resolveEngineAndModel('groq-free', undefined, isLocked, isAdmin);
      expect(groqRes.engine).toBe('groq-free');

      const flashRes = resolveEngineAndModel('gemini-flash', undefined, isLocked, isAdmin);
      expect(flashRes.engine).toBe('gemini-flash');
      expect(flashRes.model).toBe('gemini-2.5-flash');

      const mockRes = resolveEngineAndModel('mock', undefined, isLocked, isAdmin);
      expect(mockRes.engine).toBe('mock');
      expect(mockRes.isMock).toBe(true);
    });

    it('allows all options when not locked (localhost development)', () => {
      const isLocked = false;
      const isAdmin = false;

      const ollamaRes = resolveEngineAndModel('ollama-balanced', undefined, isLocked, isAdmin);
      expect(ollamaRes.engine).toBe('ollama-balanced');

      const groqRes = resolveEngineAndModel('groq-free', undefined, isLocked, isAdmin);
      expect(groqRes.engine).toBe('groq-free');

      const flashRes = resolveEngineAndModel('gemini-flash', undefined, isLocked, isAdmin);
      expect(flashRes.engine).toBe('gemini-flash');
      expect(flashRes.model).toBe('gemini-2.5-flash');
    });
  });
});

