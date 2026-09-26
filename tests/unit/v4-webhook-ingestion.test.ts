import { describe, it, expect, beforeEach } from 'vitest';
import { WebhookIngestionEngine } from '../../src/telemetry/webhook-ingestion.js';
import { OperationalReversalMonitor } from '../../src/monitoring/reversal-monitor.js';
import { DecisionMemoryStore } from '../../src/memory/decision-memory.js';

describe('WebhookIngestionEngine (V4.4)', () => {
  let reversalMonitor: OperationalReversalMonitor;
  let decisionMemory: DecisionMemoryStore;
  let engine: WebhookIngestionEngine;

  beforeEach(() => {
    reversalMonitor = new OperationalReversalMonitor();
    reversalMonitor.reset(true); // reset clean
    decisionMemory = new DecisionMemoryStore({}, false); // pre-seeded
    engine = new WebhookIngestionEngine({ reversalMonitor, decisionMemory });

    // Register active test contract on PENDING decision HIST-021
    reversalMonitor.registerDecisionContracts('HIST-021', [
      {
        id: 'rc-cache-err',
        metric: 'error_rate_percent',
        operator: '>',
        threshold: 1.5,
        window: '5m',
        action: 'ROLLBACK',
        description: 'Breach if CDN cache error rate exceeds 1.5%',
        status: 'ACTIVE',
      },
    ]);
  });

  it('should parse and normalize Prometheus Alertmanager firing webhook', () => {
    const promPayload = {
      receiver: 'magi-webhook',
      status: 'firing',
      alerts: [
        {
          status: 'firing',
          labels: {
            alertname: 'HighCacheErrorRate',
            severity: 'critical',
            contract_id: 'rc-cache-err',
            decision_id: 'HIST-021',
            metric: 'error_rate_percent',
          },
          annotations: {
            summary: 'CDN edge proxy 5xx spike at 2.4%',
            value: '2.4',
          },
          startsAt: '2026-09-22T14:00:00Z',
        },
      ],
    };

    const result = engine.parseAndIngest(promPayload, { 'user-agent': 'Alertmanager/0.26.0' });

    expect(result.success).toBe(true);
    expect(result.formatDetected).toBe('PROMETHEUS');
    expect(result.alertsProcessed).toBe(1);
    expect(result.matchedContractIds).toContain('rc-cache-err');
    expect(result.matchedDecisionIds).toContain('HIST-021');
    expect(result.trippedDecisions).toContain('HIST-021');

    // Verify DecisionMemoryStore updated autonomously
    const decision = decisionMemory.getDecision('HIST-021');
    expect(decision?.status).toBe('REVERTED');
    expect(decision?.trippedContractId).toBe('rc-cache-err');
    expect(decision?.postMortem).toBeDefined();
  });

  it('should parse and normalize Grafana alerting webhook', () => {
    const grafanaPayload = {
      state: 'alerting',
      ruleId: 104,
      ruleName: 'Latency P99 SLO Violation',
      message: 'P99 latency breached 500ms ceiling',
      tags: {
        contract_id: 'rc-pool-starve',
      },
      evalMatches: [
        {
          metric: 'p99_latency_ms',
          value: 780,
        },
      ],
    };

    const result = engine.parseAndIngest(grafanaPayload, { 'user-agent': 'Grafana/11.0' });

    expect(result.success).toBe(true);
    expect(result.formatDetected).toBe('GRAFANA');
    expect(result.alertsProcessed).toBe(1);
    expect(result.matchedContractIds).toContain('rc-pool-starve');
  });

  it('should parse and normalize Datadog monitor webhook', () => {
    const datadogPayload = {
      id: 99482,
      title: 'Database connection pool starvation',
      alert_type: 'error',
      event_type: 'query_alert_monitor',
      metric: 'error_rate_percent',
      value: 3.8,
      body: 'Handle starvation on primary pool',
    };

    const result = engine.parseAndIngest(datadogPayload, { 'user-agent': 'Datadog-Webhook/1.0' });

    expect(result.success).toBe(true);
    expect(result.formatDetected).toBe('DATADOG');
    expect(result.alertsProcessed).toBe(1);
  });

  it('should parse generic MAGI payload and trip contract when metric breaches threshold', () => {
    const genericPayload = {
      contractId: 'rc-cache-err',
      metricName: 'error_rate_percent',
      value: 2.1,
      status: 'FIRING',
      reason: 'Error rate at 2.1% exceeds threshold of 1.5%',
    };

    const result = engine.parseAndIngest(genericPayload);

    expect(result.success).toBe(true);
    expect(result.formatDetected).toBe('MAGI_GENERIC');
    expect(result.matchedContractIds).toContain('rc-cache-err');
    expect(result.trippedDecisions).toContain('HIST-021');

    const decision = decisionMemory.getDecision('HIST-021');
    expect(decision?.status).toBe('REVERTED');
  });

  it('should gracefully handle invalid or empty payloads', () => {
    const result = engine.parseAndIngest(null as any);
    expect(result.success).toBe(false);
    expect(result.alertsProcessed).toBe(0);
  });
});
