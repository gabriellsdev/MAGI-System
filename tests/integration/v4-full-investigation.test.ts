import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as http from 'node:http';
import { createServer } from '../../src/server/server.js';

describe('V4 Integration — HTTP Endpoints (/api/v4/evidence, /api/v4/investigate, /api/v4/execute)', () => {
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

  it('GET /api/v4/evidence should return evidence list and average reliability', async () => {
    const res = await fetch(`${baseUrl}/api/v4/evidence`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.count).toBeDefined();
    expect(data.averageReliability).toBeDefined();
    expect(Array.isArray(data.evidence)).toBe(true);
  });

  it('POST /api/v4/investigate should return structured investigation plan and empirical brief', async () => {
    const payload = {
      question: 'Should we migrate our PostgreSQL database to MongoDB?',
      mock: true,
    };

    const res = await fetch(`${baseUrl}/api/v4/investigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.plan).toBeDefined();
    expect(data.plan.knowns.length).toBeGreaterThan(0);
    expect(data.plan.unknowns.length).toBeGreaterThan(0);
    expect(data.evidenceGathered.length).toBeGreaterThan(0);
    expect(data.dilemmaBrief).toContain('=== MAGI V4 INVESTIGATION BRIEF ===');
    expect(data.readinessForDeliberation).toBe('READY');
  });

  it('POST /api/v4/execute should run full V4 cognitive lifecycle end-to-end', async () => {
    const payload = {
      question: 'Should we migrate our PostgreSQL database to MongoDB?',
      mock: true,
    };

    const res = await fetch(`${baseUrl}/api/v4/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-fast-mock': 'true',
      },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.problem).toBe(payload.question);
    expect(data.executionPath).toBe('DEEP_INVESTIGATION');
    expect(data.classification.complexity).toBe('CRITICAL');
    expect(data.classification.requiresInvestigation).toBe(true);
    expect(data.investigation).toBeDefined();
    expect(data.synthesis).toBeDefined();
    expect(data.steps.length).toBe(6);
  });
});
