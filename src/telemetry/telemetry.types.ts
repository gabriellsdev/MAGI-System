export type WebhookSourceFormat = 'PROMETHEUS' | 'GRAFANA' | 'DATADOG' | 'MAGI_GENERIC';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'CATASTROPHIC';

export interface NormalizedAlert {
  alertId: string;
  source: WebhookSourceFormat;
  status: 'FIRING' | 'RESOLVED';
  severity: AlertSeverity;
  contractId?: string;
  decisionId?: string;
  metricName?: string;
  observedValue?: number;
  threshold?: number;
  summary: string;
  timestamp: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
}

export interface WebhookIngestionResult {
  success: boolean;
  formatDetected: WebhookSourceFormat;
  alertsProcessed: number;
  matchedContractIds: string[];
  matchedDecisionIds: string[];
  trippedDecisions: string[];
  rawSummary: string;
  timestamp: string;
}

export interface MetricObservation {
  id: string;
  metricName: string;
  value: number;
  timestamp: string;
  contractId?: string;
  decisionId?: string;
  source: string;
  metadata?: Record<string, unknown>;
}

export interface HeartbeatTickReport {
  timestamp: string;
  pendingDecisionsEvaluated: number;
  activeContractsEvaluated: number;
  contractsTripped: number;
  decisionsReverted: string[];
  decisionsSurvived: string[];
  activeObservationsCount: number;
  errors: string[];
}

export interface TelemetryHeartbeatStatus {
  isRunning: boolean;
  intervalMs: number;
  totalTicks: number;
  lastTickTimestamp?: string;
  lastReport?: HeartbeatTickReport;
}
