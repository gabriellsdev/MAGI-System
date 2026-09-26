import type {
  NormalizedAlert,
  WebhookIngestionResult,
  WebhookSourceFormat,
  AlertSeverity,
} from './telemetry.types.js';
import { globalReversalMonitor, OperationalReversalMonitor } from '../monitoring/reversal-monitor.js';
import { globalDecisionMemory, DecisionMemoryStore } from '../memory/decision-memory.js';

export interface WebhookIngestionOptions {
  reversalMonitor?: OperationalReversalMonitor;
  decisionMemory?: DecisionMemoryStore;
}

export class WebhookIngestionEngine {
  private reversalMonitor: OperationalReversalMonitor;
  private decisionMemory: DecisionMemoryStore;

  constructor(options: WebhookIngestionOptions = {}) {
    this.reversalMonitor = options.reversalMonitor ?? globalReversalMonitor;
    this.decisionMemory = options.decisionMemory ?? globalDecisionMemory;
  }

  /**
   * Identifies webhook payload format, normalizes alerts, and matches against pending contracts
   */
  public parseAndIngest(rawPayload: unknown, headers: Record<string, string> = {}): WebhookIngestionResult {
    if (!rawPayload || typeof rawPayload !== 'object') {
      return {
        success: false,
        formatDetected: 'MAGI_GENERIC',
        alertsProcessed: 0,
        matchedContractIds: [],
        matchedDecisionIds: [],
        trippedDecisions: [],
        rawSummary: 'Invalid or empty webhook payload received.',
        timestamp: new Date().toISOString(),
      };
    }

    const payload = rawPayload as Record<string, unknown>;
    const format = this.detectFormat(payload, headers);
    const normalizedAlerts = this.normalizePayload(payload, format);

    const matchedContracts: string[] = [];
    const matchedDecisions: string[] = [];
    const trippedDecisions: string[] = [];

    for (const alert of normalizedAlerts) {
      // Find contract reference if present
      let contractId = alert.contractId;
      let decisionId = alert.decisionId;

      if (!contractId && alert.labels.contract_id) contractId = alert.labels.contract_id;
      if (!contractId && alert.labels.contractId) contractId = alert.labels.contractId;
      if (!decisionId && alert.labels.decision_id) decisionId = alert.labels.decision_id;
      if (!decisionId && alert.labels.decisionId) decisionId = alert.labels.decisionId;

      // If metric and value are present, evaluate against ReversalMonitor
      if (alert.metricName && typeof alert.observedValue === 'number') {
        const events = this.reversalMonitor.ingestTelemetry(
          alert.metricName,
          alert.observedValue,
          alert.timestamp
        );

        for (const ev of events) {
          if (!matchedContracts.includes(ev.contractId)) matchedContracts.push(ev.contractId);
          if (!matchedDecisions.includes(ev.decisionId)) matchedDecisions.push(ev.decisionId);

          // Update DecisionMemoryStore if decision is pending
          const decision = this.decisionMemory.getDecision(ev.decisionId);
          if (decision && decision.status === 'PENDING') {
            this.decisionMemory.trackDecisionOutcome({
              decisionId: ev.decisionId,
              status: 'REVERTED',
              actualOutcome: `Operational contract tripped via ${alert.source}: ${ev.description} (Observed: ${ev.observedValue} ${ev.operator} ${ev.threshold})`,
              reversalReason: `Automated telemetry breach: ${ev.metric} breached threshold ${ev.threshold}`,
              trippedContractId: ev.contractId,
              observedMetrics: { [ev.metric]: ev.observedValue },
              timestamp: alert.timestamp,
            });
            if (!trippedDecisions.includes(ev.decisionId)) {
              trippedDecisions.push(ev.decisionId);
            }
          }
        }
      }

      // If alert specifies an explicit contractId that is firing
      if (contractId) {
        if (!matchedContracts.includes(contractId)) matchedContracts.push(contractId);
        const contractInfo = this.reversalMonitor.getContractById(contractId);
        if (contractInfo) {
          const dId = contractInfo.decisionId;
          if (!matchedDecisions.includes(dId)) matchedDecisions.push(dId);

          if (alert.status === 'FIRING') {
            const decision = this.decisionMemory.getDecision(dId);
            if (decision && decision.status === 'PENDING') {
              this.decisionMemory.trackDecisionOutcome({
                decisionId: dId,
                status: 'REVERTED',
                actualOutcome: `Direct webhook alert firing for contract ${contractId}: ${alert.summary}`,
                reversalReason: alert.summary || `Alertmanager fired alert for contract ${contractId}`,
                trippedContractId: contractId,
                observedMetrics: alert.observedValue ? { [alert.metricName || 'metric']: alert.observedValue } : undefined,
                timestamp: alert.timestamp,
              });
              if (!trippedDecisions.includes(dId)) {
                trippedDecisions.push(dId);
              }
            }
          }
        }
      }
    }

    return {
      success: true,
      formatDetected: format,
      alertsProcessed: normalizedAlerts.length,
      matchedContractIds: matchedContracts,
      matchedDecisionIds: matchedDecisions,
      trippedDecisions,
      rawSummary: `Ingested ${normalizedAlerts.length} alert(s) via ${format}. Matched ${matchedContracts.length} contract(s). Tripped ${trippedDecisions.length} decision(s).`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Detects the webhook source format from payload attributes or headers
   */
  private detectFormat(payload: Record<string, unknown>, headers: Record<string, string>): WebhookSourceFormat {
    const userAgent = (headers['user-agent'] || headers['User-Agent'] || '').toLowerCase();

    if (userAgent.includes('alertmanager') || Array.isArray(payload.alerts)) {
      return 'PROMETHEUS';
    }

    if (userAgent.includes('grafana') || payload.ruleName !== undefined || payload.evalMatches !== undefined) {
      return 'GRAFANA';
    }

    if (payload.event_type !== undefined || payload.alert_type !== undefined || userAgent.includes('datadog')) {
      return 'DATADOG';
    }

    return 'MAGI_GENERIC';
  }

  /**
   * Normalizes vendor payload schemas into a standard NormalizedAlert array
   */
  private normalizePayload(payload: Record<string, unknown>, format: WebhookSourceFormat): NormalizedAlert[] {
    const now = new Date().toISOString();

    switch (format) {
      case 'PROMETHEUS': {
        const rawAlerts = Array.isArray(payload.alerts) ? (payload.alerts as Record<string, unknown>[]) : [];
        return rawAlerts.map((a, idx) => {
          const labels = (a.labels as Record<string, string>) || {};
          const annotations = (a.annotations as Record<string, string>) || {};
          const status = a.status === 'resolved' ? 'RESOLVED' : 'FIRING';
          const severity = this.mapSeverity(labels.severity);
          const summary = annotations.summary || annotations.description || labels.alertname || `Prometheus Alert ${idx + 1}`;
          const contractId = labels.contract_id || labels.contractId || annotations.contract_id;
          const decisionId = labels.decision_id || labels.decisionId || annotations.decision_id;
          const metricName = labels.metric || labels.metric_name || labels.alertname;
          const observedValue = annotations.value !== undefined ? Number(annotations.value) : undefined;

          return {
            alertId: `prom-${idx + 1}-${Date.now()}`,
            source: 'PROMETHEUS',
            status,
            severity,
            contractId,
            decisionId,
            metricName,
            observedValue: isNaN(observedValue ?? NaN) ? undefined : observedValue,
            summary,
            timestamp: (a.startsAt as string) || now,
            labels,
            annotations,
          };
        });
      }

      case 'GRAFANA': {
        const state = String(payload.state || '').toLowerCase();
        const status = state === 'ok' ? 'RESOLVED' : 'FIRING';
        const ruleName = String(payload.ruleName || 'Grafana Rule');
        const message = String(payload.message || ruleName);
        const evalMatches = Array.isArray(payload.evalMatches) ? (payload.evalMatches as Record<string, unknown>[]) : [];
        const firstMatch = evalMatches[0];

        const metricName = firstMatch ? String(firstMatch.metric || '') : undefined;
        const observedValue = firstMatch && typeof firstMatch.value === 'number' ? firstMatch.value : undefined;
        const tags = (payload.tags as Record<string, string>) || {};

        return [
          {
            alertId: `grafana-${payload.ruleId || Date.now()}`,
            source: 'GRAFANA',
            status,
            severity: status === 'FIRING' ? 'CRITICAL' : 'INFO',
            contractId: tags.contract_id || tags.contractId,
            decisionId: tags.decision_id || tags.decisionId,
            metricName,
            observedValue,
            summary: message,
            timestamp: now,
            labels: tags,
            annotations: { ruleUrl: String(payload.ruleUrl || '') },
          },
        ];
      }

      case 'DATADOG': {
        const title = String(payload.title || 'Datadog Alert');
        const alertType = String(payload.alert_type || '').toLowerCase();
        const status = alertType === 'success' ? 'RESOLVED' : 'FIRING';
        const metricName = payload.metric ? String(payload.metric) : undefined;
        const value = payload.value !== undefined ? Number(payload.value) : undefined;

        return [
          {
            alertId: `dd-${payload.id || Date.now()}`,
            source: 'DATADOG',
            status,
            severity: status === 'FIRING' ? 'CRITICAL' : 'INFO',
            metricName,
            observedValue: isNaN(value ?? NaN) ? undefined : value,
            summary: title,
            timestamp: now,
            labels: {},
            annotations: { body: String(payload.body || '') },
          },
        ];
      }

      case 'MAGI_GENERIC':
      default: {
        const contractId = payload.contractId ? String(payload.contractId) : (payload.contract_id ? String(payload.contract_id) : undefined);
        const decisionId = payload.decisionId ? String(payload.decisionId) : (payload.decision_id ? String(payload.decision_id) : undefined);
        const metricName = payload.metricName ? String(payload.metricName) : (payload.metric ? String(payload.metric) : undefined);
        const observedValue = typeof payload.value === 'number' ? payload.value : (typeof payload.observedValue === 'number' ? payload.observedValue : undefined);
        const status = payload.status === 'RESOLVED' || payload.status === 'ok' ? 'RESOLVED' : 'FIRING';
        const summary = String(payload.summary || payload.reason || payload.message || 'Generic Metric Telemetry Event');

        return [
          {
            alertId: `magi-${Date.now()}`,
            source: 'MAGI_GENERIC',
            status,
            severity: status === 'FIRING' ? 'CRITICAL' : 'INFO',
            contractId,
            decisionId,
            metricName,
            observedValue,
            summary,
            timestamp: String(payload.timestamp || now),
            labels: (payload.labels as Record<string, string>) || {},
            annotations: (payload.annotations as Record<string, string>) || {},
          },
        ];
      }
    }
  }

  private mapSeverity(raw?: string): AlertSeverity {
    if (!raw) return 'WARNING';
    const lower = raw.toLowerCase();
    if (lower.includes('catastroph') || lower.includes('fatal')) return 'CATASTROPHIC';
    if (lower.includes('crit') || lower.includes('error')) return 'CRITICAL';
    if (lower.includes('warn')) return 'WARNING';
    return 'INFO';
  }
}

export const globalWebhookEngine = new WebhookIngestionEngine();
