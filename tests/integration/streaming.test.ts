import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as http from 'node:http';
import { createServer } from '../../src/server/server.js';

describe('Server-Sent Events (SSE) Streaming API (V1.3)', () => {
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

  it('POST /api/deliberate/stream should stream agent deliberation events in real-time', async () => {
    const res = await fetch(`${baseUrl}/api/deliberate/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'How effective would a Magi supercomputer run society actually be?',
        mock: true,
      }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');

    const text = await res.text();
    expect(text).toContain('event: round_start');
    expect(text).toContain('event: agent_start');
    expect(text).toContain('event: agent_complete');
    expect(text).toContain('event: synthesis_start');
    expect(text).toContain('event: complete');

    // Parse events
    const events: { event: string; data: any }[] = [];
    const blocks = text.split('\n\n');
    for (const block of blocks) {
      if (!block.trim()) continue;
      let event = '';
      let data = '';
      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) event = line.replace('event:', '').trim();
        if (line.startsWith('data:')) data = line.replace('data:', '').trim();
      }
      if (event && data) {
        events.push({ event, data: JSON.parse(data) });
      }
    }

    // Verify event ordering & payload structures
    const roundStarts = events.filter(e => e.event === 'round_start');
    expect(roundStarts.length).toBeGreaterThanOrEqual(1);

    const agentStarts = events.filter(e => e.event === 'agent_start');
    expect(agentStarts.length).toBeGreaterThanOrEqual(3);

    const agentCompletes = events.filter(e => e.event === 'agent_complete');
    expect(agentCompletes.length).toBeGreaterThanOrEqual(3);

    const completeEvent = events.find(e => e.event === 'complete');
    expect(completeEvent).toBeDefined();
    expect(completeEvent?.data.result).toBeDefined();
    expect(completeEvent?.data.result.finalDecision).toBeDefined();
    expect(completeEvent?.data.result.coreVerdict).toBeDefined();
  }, 15000);

  it('POST /api/compare should return complete comparison report', async () => {
    const res = await fetch(`${baseUrl}/api/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'How effective would a Magi supercomputer run society actually be?',
        mock: true,
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.singleBaseline).toBeDefined();
    expect(data.magiResult).toBeDefined();
    expect(data.differential).toBeDefined();
  });

  it('GET /api/benchmark should execute and return benchmark scorecard summary', async () => {
    const res = await fetch(`${baseUrl}/api/benchmark?mock=true`);
    expect(res.status).toBe(200);

    const summary = await res.json();
    expect(summary.totalDilemmas).toBeGreaterThan(0);
    expect(summary.scorecards.length).toBe(summary.totalDilemmas);
  }, 15000);
});
