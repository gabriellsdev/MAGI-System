import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as http from 'node:http';
import { createServer, getEffectiveAdminKey } from '../../src/server/server.js';

describe('HTTP Server & API Endpoints (/api/deliberate, /api/health)', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    server = createServer();
    await new Promise<void>(resolve => {
      server.listen(0, () => {
        const address = server.address() as any;
        baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close(err => (err ? reject(err) : resolve()));
    });
  });

  it('GET /api/health should return system status ok', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('ok');
    expect(data.version).toBe('4.6.0');
    const expectedModel = process.env.GROQ_API_KEY ? 'openai/gpt-oss-120b' : 'gemini-3.1-pro-preview';
    expect(data.defaultModel).toBe(process.env.DEFAULT_MODEL || expectedModel);
  });

  it('POST /api/deliberate should return valid synthesis in mock mode', async () => {
    const payload = {
      question: 'Devemos adotar Rust no backend?',
      language: 'Portuguese',
      mock: true,
    };

    const res = await fetch(`${baseUrl}/api/deliberate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.question).toBe(payload.question);
    expect(data.finalDecision).toBeDefined();
    expect(data.coreVerdict).toBeDefined();
    expect(data.initialAnalysis.MELCHIOR).toBeDefined();
    expect(data.initialAnalysis.BALTHASAR).toBeDefined();
    expect(data.initialAnalysis.CASPER).toBeDefined();
    expect(data.metadata).toBeDefined();
    expect(data.metadata.provider).toBe('mock');
  });

  it('POST /api/deliberate should return 400 when question is missing or empty', async () => {
    const res = await fetch(`${baseUrl}/api/deliberate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: '   ' }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('required');
  });

  it('GET / should serve the web application HTML', async () => {
    const res = await fetch(`${baseUrl}/`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');

    const html = await res.text();
    expect(html).toContain('MAGI SYSTEM');
    expect(html).toContain('anime-view');
    expect(html).toContain('btn-view-anime');
    expect(html).toContain('質 問');
    expect(html).toContain('解 決');
    expect(html).toContain('tactical-view');
    expect(html).toContain('diagnostic-view');
    expect(html).toContain('btn-view-tactical');
    expect(html).toContain('copy-ascii-btn');
    expect(html).toContain('MELCHIOR • 1');
    expect(html).toContain('BALTHASAR • 2');
    expect(html).toContain('CASPER • 3');
  });

  it('GET /style.css should serve the stylesheet', async () => {
    const res = await fetch(`${baseUrl}/style.css`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/css');
  });

  it('GET /api/history should return history array and configuration status', async () => {
    const res = await fetch(`${baseUrl}/api/history?limit=5`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data.history)).toBe(true);
    expect(typeof data.configured).toBe('boolean');
  }, 15000);

  it('POST /api/auth/operator should authenticate operator and issue temporary session', async () => {
    // 1. Invalid key attempt
    const invalidRes = await fetch(`${baseUrl}/api/auth/operator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'invalid-password-123' }),
    });
    expect(invalidRes.status).toBe(401);
    const invalidData = await invalidRes.json();
    expect(invalidData.success).toBe(false);

    // 2. Valid key attempt
    const effectiveKey = getEffectiveAdminKey();
    const validRes = await fetch(`${baseUrl}/api/auth/operator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: effectiveKey }),
    });
    expect(validRes.status).toBe(200);
    const validData = await validRes.json();
    expect(validData.success).toBe(true);
    expect(typeof validData.token).toBe('string');
    expect(validData.access).toBe('operator');
    expect(validData.expiresInMs).toBeGreaterThan(0);

    const token = validData.token;

    // 3. Verify active session
    const sessionRes = await fetch(`${baseUrl}/api/auth/session`, {
      headers: { 'X-Operator-Token': token },
    });
    expect(sessionRes.status).toBe(200);
    const sessionData = await sessionRes.json();
    expect(sessionData.authenticated).toBe(true);
    expect(sessionData.access).toBe('operator');

    // 4. Logout / revoke session
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { 'X-Operator-Token': token },
    });
    expect(logoutRes.status).toBe(200);
    const logoutData = await logoutRes.json();
    expect(logoutData.success).toBe(true);

    // 5. Verify revoked session
    const afterLogoutRes = await fetch(`${baseUrl}/api/auth/session`, {
      headers: { 'X-Operator-Token': token },
    });
    expect(afterLogoutRes.status).toBe(200);
    const afterLogoutData = await afterLogoutRes.json();
    expect(afterLogoutData.authenticated).toBe(false);
    expect(afterLogoutData.access).toBe('public');
  });
});
