import type { HeartbeatTickReport, TelemetryHeartbeatStatus } from './telemetry.types.js';
import { globalDecisionMemory, DecisionMemoryStore } from '../memory/decision-memory.js';
import { globalReversalMonitor, OperationalReversalMonitor } from '../monitoring/reversal-monitor.js';

export interface ActiveContractHeartbeatOptions {
  decisionMemory?: DecisionMemoryStore;
  reversalMonitor?: OperationalReversalMonitor;
  defaultTtlMs?: number; // e.g. 7 days in ms or configured for tests
}

export class ActiveContractHeartbeat {
  private decisionMemory: DecisionMemoryStore;
  private reversalMonitor: OperationalReversalMonitor;
  private timer: NodeJS.Timeout | null = null;
  private intervalMs: number = 60000;
  private defaultTtlMs: number;
  private totalTicks: number = 0;
  private lastTickTimestamp?: string;
  private lastReport?: HeartbeatTickReport;

  constructor(options: ActiveContractHeartbeatOptions = {}) {
    this.decisionMemory = options.decisionMemory ?? globalDecisionMemory;
    this.reversalMonitor = options.reversalMonitor ?? globalReversalMonitor;
    // Default 7 days (604800000ms), customizable for short test windows
    this.defaultTtlMs = options.defaultTtlMs ?? 7 * 24 * 60 * 60 * 1000;
  }

  /**
   * Starts periodic heartbeat evaluation in the background
   */
  public start(intervalMs: number = 60000): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.intervalMs = intervalMs;
    this.timer = setInterval(() => {
      this.tick().catch(err => {
        console.error('[MAGI HEARTBEAT ERROR]', err);
      });
    }, this.intervalMs);
  }

  /**
   * Stops the active background heartbeat timer
   */
  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Performs an immediate tick: evaluates all PENDING decisions against contracts & observation horizons
   */
  public async tick(): Promise<HeartbeatTickReport> {
    this.totalTicks += 1;
    const now = Date.now();
    const timestamp = new Date(now).toISOString();
    this.lastTickTimestamp = timestamp;

    const pendingDecisions = this.decisionMemory.getDecisions({ status: 'PENDING' });
    const decisionsReverted: string[] = [];
    const decisionsSurvived: string[] = [];
    const errors: string[] = [];

    let totalActiveContracts = 0;
    let totalContractsTripped = 0;

    for (const decision of pendingDecisions) {
      try {
        const contracts = this.reversalMonitor.getContracts({ decisionId: decision.decisionId });
        totalActiveContracts += contracts.length;

        // 1. Check if any associated contract has TRIPPED
        const trippedContract = contracts.find(c => c.status === 'TRIPPED');

        if (trippedContract) {
          totalContractsTripped += 1;
          const result = this.decisionMemory.trackDecisionOutcome({
            decisionId: decision.decisionId,
            status: 'REVERTED',
            actualOutcome: `Autonomous Heartbeat: Tripped contract ${trippedContract.id} (${trippedContract.description}) breached threshold ${trippedContract.threshold}.`,
            reversalReason: `Contract tripped: ${trippedContract.metric} ${trippedContract.operator} ${trippedContract.threshold}`,
            trippedContractId: trippedContract.id,
            observedMetrics: trippedContract.trippedValue !== undefined ? { [trippedContract.metric]: trippedContract.trippedValue } : undefined,
            timestamp,
          });

          decisionsReverted.push(decision.decisionId);
          continue;
        }

        // 2. Check if observation horizon passed without any violation (survival)
        const decisionTimestamp = new Date(decision.timestamp).getTime();
        const ageMs = now - decisionTimestamp;

        if (ageMs >= this.defaultTtlMs && contracts.every(c => c.status === 'ACTIVE' || c.status === 'DISCHARGED')) {
          this.decisionMemory.trackDecisionOutcome({
            decisionId: decision.decisionId,
            status: 'SURVIVED',
            actualOutcome: `Autonomous Heartbeat: Decision survived observation horizon (${Math.round(ageMs / 1000)}s) without contract breaches.`,
            timestamp,
          });

          decisionsSurvived.push(decision.decisionId);
        }
      } catch (err: unknown) {
        errors.push(`Error evaluating decision ${decision.decisionId}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    const report: HeartbeatTickReport = {
      timestamp,
      pendingDecisionsEvaluated: pendingDecisions.length,
      activeContractsEvaluated: totalActiveContracts,
      contractsTripped: totalContractsTripped,
      decisionsReverted,
      decisionsSurvived,
      activeObservationsCount: totalActiveContracts - totalContractsTripped,
      errors,
    };

    this.lastReport = report;
    return report;
  }

  /**
   * Explicitly closes a pending decision as SURVIVED when operational checks pass
   */
  public markSurvival(decisionId: string, actualOutcome?: string): void {
    const decision = this.decisionMemory.getDecision(decisionId);
    if (!decision) {
      throw new Error(`Decision not found in memory: ${decisionId}`);
    }
    if (decision.status !== 'PENDING') {
      return;
    }

    this.decisionMemory.trackDecisionOutcome({
      decisionId,
      status: 'SURVIVED',
      actualOutcome: actualOutcome || 'Canary validation and operational observation passed without breach.',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Returns current telemetry heartbeat status
   */
  public getStatus(): TelemetryHeartbeatStatus {
    return {
      isRunning: this.timer !== null,
      intervalMs: this.intervalMs,
      totalTicks: this.totalTicks,
      lastTickTimestamp: this.lastTickTimestamp,
      lastReport: this.lastReport,
    };
  }
}

export const globalContractHeartbeat = new ActiveContractHeartbeat();
