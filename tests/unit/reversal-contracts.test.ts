import { describe, it, expect, beforeEach } from 'vitest';
import { OperationalReversalMonitor } from '../../src/monitoring/reversal-monitor.js';
import { globalCalibrationEngine } from '../../src/calibration/calibration-engine.js';
import type { OperationalReversalContract } from '../../src/domain/types.js';

describe('V3.4 Operational Reversal Contracts & Telemetry Monitor', () => {
  let monitor: OperationalReversalMonitor;

  beforeEach(() => {
    monitor = new OperationalReversalMonitor();
    monitor.reset(true);
    globalCalibrationEngine.reset(true);
  });

  it('should register contracts and filter by status', () => {
    const contracts: OperationalReversalContract[] = [
      {
        id: 'rc-1',
        metric: 'error_rate_percent',
        operator: '>',
        threshold: 1.0,
        window: '5m',
        action: 'ROLLBACK',
        description: 'Error rate exceed 1%',
        status: 'ACTIVE',
      },
      {
        id: 'rc-2',
        metric: 'p99_latency_ms',
        operator: '>',
        threshold: 500,
        window: '15m',
        action: 'CIRCUIT_BREAK',
        description: 'Latency exceed 500ms',
        status: 'TRIPPED',
      },
    ];

    monitor.registerDecisionContracts('DEC-001', contracts);

    expect(monitor.getContracts().length).toBe(2);
    expect(monitor.getContracts({ status: 'ACTIVE' }).length).toBe(1);
    expect(monitor.getContracts({ status: 'TRIPPED' }).length).toBe(1);
    expect(monitor.getContracts({ decisionId: 'DEC-001' }).length).toBe(2);
  });

  it('should evaluate telemetry thresholds and trip breaching contracts', () => {
    const contracts: OperationalReversalContract[] = [
      {
        id: 'rc-err-1',
        metric: 'error_rate_percent',
        operator: '>',
        threshold: 2.0,
        window: '5m',
        action: 'ROLLBACK',
        description: 'API 5xx error rate exceeds 2.0%',
        status: 'ACTIVE',
      },
      {
        id: 'rc-pool-1',
        metric: 'db_pool_utilization_percent',
        operator: '>=',
        threshold: 90,
        window: '10m',
        action: 'CIRCUIT_BREAK',
        description: 'DB pool saturation',
        status: 'ACTIVE',
      },
    ];

    monitor.registerDecisionContracts('DEC-100', contracts);

    // Seed corresponding decision in calibration engine
    globalCalibrationEngine.recordOutcome({
      decisionId: 'DEC-100',
      timestamp: '2026-09-21T00:00:00Z',
      declaredConfidence: 0.90,
      status: 'SURVIVED',
    });

    // 1. Non-breaching telemetry
    const harmless = monitor.ingestTelemetry('error_rate_percent', 1.2);
    expect(harmless.length).toBe(0);
    expect(monitor.getContractById('rc-err-1')?.contract.status).toBe('ACTIVE');

    // 2. Breaching telemetry
    const tripped = monitor.ingestTelemetry('error_rate_percent', 2.8);
    expect(tripped.length).toBe(1);
    expect(tripped[0].contractId).toBe('rc-err-1');
    expect(tripped[0].observedValue).toBe(2.8);
    expect(tripped[0].action).toBe('ROLLBACK');

    // Verify contract is now marked TRIPPED
    const updatedContract = monitor.getContractById('rc-err-1')?.contract;
    expect(updatedContract?.status).toBe('TRIPPED');
    expect(updatedContract?.trippedValue).toBe(2.8);

    // Verify decision outcome in calibration engine was updated to REVERTED
    const outcome = globalCalibrationEngine.getOutcomeById('DEC-100');
    expect(outcome?.status).toBe('REVERTED');
    expect(outcome?.trippedContractId).toBe('rc-err-1');
  });

  it('should notify registered listeners when a contract trips', () => {
    const contracts: OperationalReversalContract[] = [
      {
        id: 'rc-notify-1',
        metric: 'memory_mb',
        operator: '>=',
        threshold: 1024,
        window: '5m',
        action: 'ROLLBACK',
        description: 'Memory leak alert',
        status: 'ACTIVE',
      },
    ];

    monitor.registerDecisionContracts('DEC-200', contracts);

    let receivedEvent: any = null;
    const unsubscribe = monitor.onContractTripped(event => {
      receivedEvent = event;
    });

    monitor.ingestTelemetry('memory_mb', 1200);

    expect(receivedEvent).not.toBeNull();
    expect(receivedEvent.contractId).toBe('rc-notify-1');
    expect(receivedEvent.observedValue).toBe(1200);

    unsubscribe();
  });
});
