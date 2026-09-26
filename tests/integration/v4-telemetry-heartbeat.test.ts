import { describe, it, expect, beforeEach } from 'vitest';
import { DecisionMemoryStore } from '../../src/memory/decision-memory.js';
import { OperationalReversalMonitor } from '../../src/monitoring/reversal-monitor.js';
import { WebhookIngestionEngine } from '../../src/telemetry/webhook-ingestion.js';
import { ActiveContractHeartbeat } from '../../src/telemetry/contract-heartbeat.js';

describe('V4.4 Telemetry Ingestion & Active Contract Heartbeat Integration', () => {
  let memory: DecisionMemoryStore;
  let monitor: OperationalReversalMonitor;
  let webhookEngine: WebhookIngestionEngine;
  let heartbeat: ActiveContractHeartbeat;

  beforeEach(() => {
    monitor = new OperationalReversalMonitor();
    memory = new DecisionMemoryStore({}, true); // clean empty memory
    webhookEngine = new WebhookIngestionEngine({ reversalMonitor: monitor, decisionMemory: memory });
    // short 100ms TTL for testing survival window
    heartbeat = new ActiveContractHeartbeat({ reversalMonitor: monitor, decisionMemory: memory, defaultTtlMs: 50 });
  });

  it('should autonomously monitor pending decisions, trip breached contracts via webhook, and mark surviving decisions', async () => {
    // 1. Create Decision 1: Will be breached by webhook alert
    const dec1 = memory.recordDecision({
      problem: 'Implement asynchronous background indexing for catalog search',
      domain: 'DATABASE',
      verdict: 'CONDITIONAL_PASS',
      declaredConfidence: 0.88,
      synthesisSummary: 'Approved with strict query queue ceiling.',
      decision: {
        verdict: 'CONDITIONAL_PASS',
        confidence: 0.88,
        risks: [{ id: 'r1', description: 'Query queue starvation', severity: 'HIGH', mitigation: 'Rollback if latency > 300ms' }],
        minorityConcern: 'Balthasar warned background thread pool would starve query latency.',
        reversalConditions: ['p99_latency_ms > 300'],
        evidence: [],
        assumptions: [],
        unknowns: [],
        nextActions: [],
        expectedOutcome: 'P99 latency < 200ms',
      },
    });

    monitor.registerDecisionContracts(dec1.decisionId, [
      {
        id: 'rc-index-latency',
        metric: 'p99_latency_ms',
        operator: '>',
        threshold: 300,
        window: '5m',
        action: 'ROLLBACK',
        description: 'Breach if catalog query latency exceeds 300ms',
        status: 'ACTIVE',
      },
    ]);

    // 2. Create Decision 2: Will survive cleanly
    const dec2 = memory.recordDecision({
      problem: 'Enable HTTP/3 QUIC protocol on edge ingress proxies',
      domain: 'INFRASTRUCTURE',
      verdict: 'CONDITIONAL_PASS',
      declaredConfidence: 0.90,
      synthesisSummary: 'Approved with UDP fallback.',
      decision: {
        verdict: 'CONDITIONAL_PASS',
        confidence: 0.90,
        risks: [{ id: 'r2', description: 'UDP packet drop in middleboxes', severity: 'MEDIUM', mitigation: 'Automatic TCP fallback' }],
        minorityConcern: 'Middlebox drops',
        reversalConditions: ['drop_rate > 5%'],
        evidence: [],
        assumptions: [],
        unknowns: [],
        nextActions: [],
        expectedOutcome: 'Latency drop > 10%',
      },
    });

    monitor.registerDecisionContracts(dec2.decisionId, [
      {
        id: 'rc-udp-drop',
        metric: 'udp_drop_percent',
        operator: '>',
        threshold: 5.0,
        window: '15m',
        action: 'CIRCUIT_BREAK',
        description: 'Breach if UDP drop rate exceeds 5%',
        status: 'ACTIVE',
      },
    ]);

    // Verify both are currently PENDING
    expect(memory.getDecision(dec1.decisionId)?.status).toBe('PENDING');
    expect(memory.getDecision(dec2.decisionId)?.status).toBe('PENDING');

    // 3. Webhook Alert arrives for Decision 1 breaching the latency contract
    const webhookAlert = {
      receiver: 'magi-alertmanager',
      status: 'firing',
      alerts: [
        {
          status: 'firing',
          labels: {
            alertname: 'CatalogLatencySLAExceeded',
            severity: 'critical',
            contract_id: 'rc-index-latency',
            decision_id: dec1.decisionId,
            metric: 'p99_latency_ms',
          },
          annotations: {
            summary: 'Query latency degraded to 420ms due to background indexing',
            value: '420',
          },
          startsAt: new Date().toISOString(),
        },
      ],
    };

    const webhookResult = webhookEngine.parseAndIngest(webhookAlert, { 'user-agent': 'Alertmanager/0.27.0' });
    expect(webhookResult.success).toBe(true);
    expect(webhookResult.trippedDecisions).toContain(dec1.decisionId);

    // 4. Wait for TTL window to pass for Decision 2 (60ms > 50ms TTL)
    await new Promise(r => setTimeout(r, 65));

    // 5. Trigger Autonomous Heartbeat Tick
    const tickReport = await heartbeat.tick();

    expect(tickReport.pendingDecisionsEvaluated).toBe(1); // Only dec2 was still pending before tick
    expect(tickReport.decisionsSurvived).toContain(dec2.decisionId);
    expect(tickReport.errors).toHaveLength(0);

    // 6. Inspect Final Status in DecisionMemoryStore
    const finalDec1 = memory.getDecision(dec1.decisionId);
    expect(finalDec1?.status).toBe('REVERTED');
    expect(finalDec1?.trippedContractId).toBe('rc-index-latency');
    expect(finalDec1?.postMortem?.minorityVindicated).toBe(true);

    const finalDec2 = memory.getDecision(dec2.decisionId);
    expect(finalDec2?.status).toBe('SURVIVED');
    expect(finalDec2?.actualOutcome).toContain('survived observation horizon');

    // Memory summary reflects the 1 survived and 1 reverted
    const summary = memory.getMemorySummary();
    expect(summary.survivedCount).toBe(1);
    expect(summary.revertedCount).toBe(1);
    expect(summary.pendingCount).toBe(0);
    expect(summary.survivalRate).toBe(0.5);
  });
});
