import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as http from 'node:http';
import { createServer } from '../../src/server/server.js';
import { globalReversalMonitor } from '../../src/monitoring/reversal-monitor.js';

describe('V3.4 Production Intelligence End-to-End API Integration', () => {
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

  it('GET /api/calibration should return Brier Score, ECE, and reliability bins', async () => {
    const res = await fetch(`${baseUrl}/api/calibration?bins=5`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.totalDecisions).toBeGreaterThanOrEqual(1);
    expect(typeof data.brierScore).toBe('number');
    expect(typeof data.expectedCalibrationError).toBe('number');
    expect(typeof data.overconfidenceBias).toBe('number');
    expect(Array.isArray(data.reliabilityBins)).toBe(true);
    expect(data.reliabilityBins.length).toBe(5);
  });

  it('GET /api/contracts should return active and tripped operational contracts', async () => {
    const res = await fetch(`${baseUrl}/api/contracts`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data.contracts)).toBe(true);
    expect(data.contracts.length).toBeGreaterThanOrEqual(1);
    expect(data.contracts[0]).toHaveProperty('metric');
    expect(data.contracts[0]).toHaveProperty('operator');
    expect(data.contracts[0]).toHaveProperty('threshold');
  });

  it('POST /api/contracts/evaluate should evaluate telemetry and trip breaching contracts', async () => {
    // Register an active contract specifically for this test
    globalReversalMonitor.registerDecisionContracts('DEC-INT-TEST', [
      {
        id: 'rc-int-err',
        metric: 'test_synthetic_err_rate',
        operator: '>',
        threshold: 2.5,
        window: '5m',
        action: 'ROLLBACK',
        description: 'Test synthetic error rate exceeds 2.5%',
        status: 'ACTIVE',
      },
    ]);

    const res = await fetch(`${baseUrl}/api/contracts/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: 'test_synthetic_err_rate',
        value: 4.8,
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.trippedCount).toBeGreaterThanOrEqual(1);
    expect(data.tripped[0].contractId).toBe('rc-int-err');
    expect(data.tripped[0].observedValue).toBe(4.8);
    expect(data.tripped[0].action).toBe('ROLLBACK');
  });

  it('POST /api/decisions/revert and GET /api/post-mortems should manage decision autopsies', async () => {
    // Revert a decision
    const revRes = await fetch(`${baseUrl}/api/decisions/revert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decisionId: 'HIST-021',
        reason: 'Unhandled memory leak exhausted worker memory pool during traffic spike',
        trippedContractId: 'rc-edge-err',
      }),
    });

    expect(revRes.status).toBe(200);
    const revData = await revRes.json();
    expect(revData.success).toBe(true);
    expect(revData.postMortem).toBeDefined();
    expect(revData.postMortem.decisionId).toBe('HIST-021');
    expect(revData.postMortem.minorityVindicated).toBe(true);
    expect(revData.postMortem.recommendedAdjustments.length).toBeGreaterThanOrEqual(1);

    // Verify it appears in GET /api/post-mortems
    const pmRes = await fetch(`${baseUrl}/api/post-mortems`);
    expect(pmRes.status).toBe(200);
    const pmData = await pmRes.json();
    expect(Array.isArray(pmData.postMortems)).toBe(true);
    const found = pmData.postMortems.find((p: any) => p.decisionId === 'HIST-021');
    expect(found).toBeDefined();
  });

  it('POST /api/deliberate in mock mode should include operational contracts and calibrated risk metrics', async () => {
    const res = await fetch(`${baseUrl}/api/deliberate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Should we migrate our monolith to event-driven microservices?',
        mock: true,
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.finalDecision).toBeDefined();
    expect(data.decisionMetrics).toBeDefined();
    expect(typeof data.decisionMetrics.decisionConfidence).toBe('number');
    expect(typeof data.decisionMetrics.dissentStrength).toBe('number');
    expect(typeof data.decisionMetrics.reversibility).toBe('number');
    expect(data.minorityReport).toBeDefined();
    expect(Array.isArray(data.minorityReport.contracts)).toBe(true);
    expect(data.minorityReport.contracts.length).toBeGreaterThanOrEqual(1);
  });
});
