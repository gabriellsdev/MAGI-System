import { describe, it, expect } from 'vitest';
import { InMemoryRateLimiter } from '../../src/server/rate-limiter.js';
import { validateDeliberationInput, MAX_QUESTION_LENGTH, MIN_QUESTION_LENGTH } from '../../src/server/validator.js';

describe('V2.2 Production Readiness: Validator', () => {
  it('should accept valid deliberation input', () => {
    const result = validateDeliberationInput({
      question: 'Should Neo-Tokyo deploy automated defensive shields?',
      language: 'Portuguese',
      model: 'gemini-3.1-pro-preview',
    });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.question).toBe('Should Neo-Tokyo deploy automated defensive shields?');
      expect(result.data.language).toBe('Portuguese');
      expect(result.data.model).toBe('gemini-3.1-pro-preview');
    }
  });

  it('should reject empty or missing question', () => {
    const r1 = validateDeliberationInput({});
    expect(r1.valid).toBe(false);
    if (!r1.valid) {
      expect(r1.statusCode).toBe(400);
    }

    const r2 = validateDeliberationInput({ question: '   ' });
    expect(r2.valid).toBe(false);
  });

  it('should reject question below minimum length', () => {
    const result = validateDeliberationInput({ question: 'ab' });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain(`Minimum length is ${MIN_QUESTION_LENGTH}`);
    }
  });

  it('should reject question exceeding maximum length', () => {
    const longQuestion = 'x'.repeat(MAX_QUESTION_LENGTH + 1);
    const result = validateDeliberationInput({ question: longQuestion });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.statusCode).toBe(413);
      expect(result.error).toContain(`exceeds maximum allowed length`);
    }
  });

  it('should reject invalid model or language types', () => {
    const r1 = validateDeliberationInput({ question: 'Valid question', model: '' });
    expect(r1.valid).toBe(false);

    const r2 = validateDeliberationInput({ question: 'Valid question', language: 'a'.repeat(60) });
    expect(r2.valid).toBe(false);
  });
});

describe('V2.2 Production Readiness: InMemoryRateLimiter', () => {
  it('should track request timestamps and allow up to limit', () => {
    const limiter = new InMemoryRateLimiter({
      windowMs: 1000,
      maxRequests: 3,
    });

    const ip = '192.168.1.10';

    const r1 = limiter.check(ip);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = limiter.check(ip);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = limiter.check(ip);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);

    const r4 = limiter.check(ip);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);

    limiter.destroy();
  });

  it('should isolate limits between different IP addresses', () => {
    const limiter = new InMemoryRateLimiter({
      windowMs: 1000,
      maxRequests: 1,
    });

    const rA1 = limiter.check('1.1.1.1');
    expect(rA1.allowed).toBe(true);

    const rA2 = limiter.check('1.1.1.1');
    expect(rA2.allowed).toBe(false);

    // Different IP should still be allowed
    const rB1 = limiter.check('2.2.2.2');
    expect(rB1.allowed).toBe(true);

    limiter.destroy();
  });
});
