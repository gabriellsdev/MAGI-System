import type {
  OperationalReversalContract,
  ContractStatus,
} from '../domain/types.js';
import { globalCalibrationEngine } from '../calibration/calibration-engine.js';
import { JsonFileStore } from '../storage/json-storage.js';

export interface ReversalMonitorOptions {
  storageDir?: string;
  persist?: boolean;
}

export interface TrippedContractEvent {
  contractId: string;
  decisionId: string;
  metric: string;
  operator: string;
  threshold: number;
  observedValue: number;
  action: string;
  description: string;
  timestamp: string;
}

export type ReversalEventListener = (event: TrippedContractEvent) => void;

export class OperationalReversalMonitor {
  // Maps decisionId -> list of contracts
  private decisionContracts: Map<string, OperationalReversalContract[]> = new Map();
  // Maps contractId -> decisionId
  private contractToDecisionMap: Map<string, string> = new Map();
  private listeners: ReversalEventListener[] = [];
  private fileStore: JsonFileStore<Record<string, OperationalReversalContract[]>>;

  constructor(options: ReversalMonitorOptions = {}) {
    this.fileStore = new JsonFileStore<Record<string, OperationalReversalContract[]>>('contracts.json', {}, {
      storageDir: options.storageDir,
      enabled: options.persist,
    });

    const persisted = this.fileStore.load();
    if (persisted && Object.keys(persisted).length > 0) {
      Object.entries(persisted).forEach(([decisionId, contracts]) => {
        this.decisionContracts.set(decisionId, contracts);
        contracts.forEach(c => this.contractToDecisionMap.set(c.id, decisionId));
      });
    } else {
      this.seedDefaultOperationalContracts();
      this.persist();
    }
  }

  private persist(): void {
    if (this.fileStore.isEnabled()) {
      const obj: Record<string, OperationalReversalContract[]> = {};
      this.decisionContracts.forEach((contracts, decId) => {
        obj[decId] = contracts;
      });
      this.fileStore.save(obj);
    }
  }

  /**
   * Clears all registered contracts and listeners (for testing)
   */
  public reset(empty = false): void {
    this.decisionContracts.clear();
    this.contractToDecisionMap.clear();
    this.listeners = [];
    if (!empty) {
      this.seedDefaultOperationalContracts();
    }
    this.persist();
  }

  /**
   * Registers operational contracts for a synthesized decision
   */
  public registerDecisionContracts(decisionId: string, contracts: OperationalReversalContract[]): void {
    if (!contracts || contracts.length === 0) return;

    const existing = this.decisionContracts.get(decisionId) || [];
    const updated = [...existing];

    contracts.forEach(contract => {
      // Avoid duplicate registration
      const existingIdx = updated.findIndex(c => c.id === contract.id);
      if (existingIdx >= 0) {
        updated[existingIdx] = { ...contract };
      } else {
        updated.push({ ...contract });
      }
      this.contractToDecisionMap.set(contract.id, decisionId);
    });

    this.decisionContracts.set(decisionId, updated);
    this.persist();
  }

  /**
   * Retrieves registered contracts with optional filters
   */
  public getContracts(filter?: { status?: ContractStatus; decisionId?: string }): OperationalReversalContract[] {
    let result: OperationalReversalContract[] = [];

    if (filter?.decisionId) {
      result = this.decisionContracts.get(filter.decisionId) || [];
    } else {
      for (const list of this.decisionContracts.values()) {
        result.push(...list);
      }
    }

    if (filter?.status) {
      result = result.filter(c => c.status === filter.status);
    }

    return result;
  }

  /**
   * Retrieves a contract and its associated decision ID by contract ID
   */
  public getContractById(contractId: string): { decisionId: string; contract: OperationalReversalContract } | undefined {
    const decisionId = this.contractToDecisionMap.get(contractId);
    if (!decisionId) return undefined;

    const list = this.decisionContracts.get(decisionId);
    const contract = list?.find(c => c.id === contractId);
    if (!contract) return undefined;

    return { decisionId, contract };
  }

  /**
   * Ingests a telemetry metric data point and evaluates all active contracts
   * @param metric Telemetry identifier (e.g. "error_rate_percent", "p99_latency_ms")
   * @param value Observed numerical telemetry value
   * @param timestamp Optional ISO timestamp
   * @returns Array of newly tripped contract events
   */
  public ingestTelemetry(metric: string, value: number, timestamp?: string): TrippedContractEvent[] {
    const ts = timestamp || new Date().toISOString();
    const trippedEvents: TrippedContractEvent[] = [];

    for (const [decisionId, contracts] of this.decisionContracts.entries()) {
      contracts.forEach(contract => {
        if (contract.status !== 'ACTIVE') return;
        if (contract.metric !== metric) return;

        const isBreached = this.evaluateThreshold(value, contract.operator, contract.threshold);

        if (isBreached) {
          contract.status = 'TRIPPED';
          contract.trippedAt = ts;
          contract.trippedValue = value;

          const event: TrippedContractEvent = {
            contractId: contract.id,
            decisionId,
            metric: contract.metric,
            operator: contract.operator,
            threshold: contract.threshold,
            observedValue: value,
            action: contract.action,
            description: contract.description,
            timestamp: ts,
          };

          trippedEvents.push(event);

          // Update calibration engine record to REVERTED
          const existingOutcome = globalCalibrationEngine.getOutcomeById(decisionId);
          if (existingOutcome) {
            existingOutcome.status = 'REVERTED';
            existingOutcome.reversalReason = `Operational contract breached: ${contract.description} (Value: ${value} ${contract.operator} ${contract.threshold})`;
            existingOutcome.trippedContractId = contract.id;
            existingOutcome.reversalTimestamp = ts;
            globalCalibrationEngine.recordOutcome(existingOutcome);
          }

          // Emit to listeners
          this.listeners.forEach(fn => fn(event));
        }
      });
    }

    if (trippedEvents.length > 0) {
      this.persist();
    }

    return trippedEvents;
  }

  /**
   * Subscribes to contract tripped events
   */
  public onContractTripped(listener: ReversalEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Evaluates comparison operator
   */
  private evaluateThreshold(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case '>':
        return value > threshold;
      case '>=':
        return value >= threshold;
      case '<':
        return value < threshold;
      case '<=':
        return value <= threshold;
      case '==':
        return Math.abs(value - threshold) < 1e-6;
      default:
        return false;
    }
  }

  /**
   * Seeds historical operational contracts corresponding to seeded decisions
   */
  private seedDefaultOperationalContracts(): void {
    const historicalContracts: { decisionId: string; contracts: OperationalReversalContract[] }[] = [
      {
        decisionId: 'HIST-009',
        contracts: [
          {
            id: 'rc-pool-starve',
            metric: 'db_pool_utilization_percent',
            operator: '>=',
            threshold: 95,
            window: '5m',
            action: 'ROLLBACK',
            description: 'Database connection pool utilization must not exceed 95% for more than 5 minutes',
            status: 'TRIPPED',
            trippedAt: '2026-08-20T13:42:00Z',
            trippedValue: 98.4,
          },
        ],
      },
      {
        decisionId: 'HIST-010',
        contracts: [
          {
            id: 'rc-p99-lock',
            metric: 'p99_latency_ms',
            operator: '>',
            threshold: 500,
            window: '10m',
            action: 'CIRCUIT_BREAK',
            description: 'P99 response latency must remain under 500ms under production load',
            status: 'TRIPPED',
            trippedAt: '2026-08-24T02:11:00Z',
            trippedValue: 825.0,
          },
        ],
      },
      {
        decisionId: 'HIST-021',
        contracts: [
          {
            id: 'rc-edge-err',
            metric: 'error_rate_percent',
            operator: '>',
            threshold: 1.5,
            window: '5m',
            action: 'ROLLBACK',
            description: 'Edge API 5xx error rate must not exceed 1.5% during canary rollout',
            status: 'ACTIVE',
          },
          {
            id: 'rc-edge-lat',
            metric: 'p99_latency_ms',
            operator: '>',
            threshold: 250,
            window: '15m',
            action: 'REEVALUATE',
            description: 'Edge proxy p99 latency must remain under 250ms',
            status: 'ACTIVE',
          },
        ],
      },
    ];

    historicalContracts.forEach(({ decisionId, contracts }) => {
      this.registerDecisionContracts(decisionId, contracts);
    });
  }
}

export const globalReversalMonitor = new OperationalReversalMonitor();
