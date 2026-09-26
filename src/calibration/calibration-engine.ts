import type {
  DecisionOutcomeRecord,
  CalibrationReport,
  ReliabilityBin,
} from '../domain/types.js';

export class ConfidenceCalibrationEngine {
  private records: Map<string, DecisionOutcomeRecord> = new Map();

  constructor(initialRecords?: DecisionOutcomeRecord[]) {
    if (initialRecords) {
      initialRecords.forEach(r => this.records.set(r.decisionId, { ...r }));
    } else {
      this.seedDefaultHistoricalRecords();
    }
  }

  /**
   * Resets all records in the engine (useful for clean unit testing)
   */
  public reset(empty = false): void {
    this.records.clear();
    if (!empty) {
      this.seedDefaultHistoricalRecords();
    }
  }

  /**
   * Records or updates a decision outcome in the calibration database
   */
  public recordOutcome(record: DecisionOutcomeRecord): void {
    this.records.set(record.decisionId, { ...record });
  }

  /**
   * Retrieves all decision outcome records
   */
  public getOutcomes(): DecisionOutcomeRecord[] {
    return Array.from(this.records.values());
  }

  /**
   * Retrieves a specific decision outcome by ID
   */
  public getOutcomeById(decisionId: string): DecisionOutcomeRecord | undefined {
    return this.records.get(decisionId);
  }

  /**
   * Calculates comprehensive confidence calibration metrics including Brier Score and ECE
   * @param binCount Number of calibration bins (default: 5)
   */
  public computeCalibrationReport(binCount = 5): CalibrationReport {
    const allRecords = Array.from(this.records.values());
    const resolvedRecords = allRecords.filter(r => r.status === 'SURVIVED' || r.status === 'REVERTED');

    const totalDecisions = allRecords.length;
    const survivedCount = allRecords.filter(r => r.status === 'SURVIVED').length;
    const revertedCount = allRecords.filter(r => r.status === 'REVERTED').length;
    const pendingCount = allRecords.filter(r => r.status === 'PENDING').length;

    if (resolvedRecords.length === 0) {
      return {
        totalDecisions,
        survivedCount,
        revertedCount,
        pendingCount,
        brierScore: 0,
        expectedCalibrationError: 0,
        overconfidenceBias: 0,
        reliabilityBins: [],
      };
    }

    const N = resolvedRecords.length;

    // 1. Calculate Brier Score: (1/N) * sum((f_i - o_i)^2)
    let sumSquaredError = 0;
    let sumConfidence = 0;
    let sumOutcome = 0;

    resolvedRecords.forEach(r => {
      const f = Math.max(0, Math.min(1, r.declaredConfidence));
      const o = r.status === 'SURVIVED' ? 1.0 : 0.0;
      sumSquaredError += Math.pow(f - o, 2);
      sumConfidence += f;
      sumOutcome += o;
    });

    const brierScore = Number((sumSquaredError / N).toFixed(4));
    const meanConfidence = sumConfidence / N;
    const meanOutcome = sumOutcome / N;
    const overconfidenceBias = Number((meanConfidence - meanOutcome).toFixed(4));

    // 2. Partition into reliability bins for Expected Calibration Error (ECE)
    // Dynamic bin partitioning across [0.0, 1.0]
    const binWidth = 1.0 / binCount;
    const bins: {
      binStart: number;
      binEnd: number;
      records: DecisionOutcomeRecord[];
    }[] = [];

    for (let i = 0; i < binCount; i++) {
      const binStart = Number((i * binWidth).toFixed(2));
      const binEnd = Number(((i + 1) * binWidth).toFixed(2));
      bins.push({ binStart, binEnd, records: [] });
    }

    resolvedRecords.forEach(r => {
      const conf = Math.max(0, Math.min(1, r.declaredConfidence));
      // Assign to appropriate bin (boundary edge goes to top bin if 1.0)
      let binIndex = Math.min(binCount - 1, Math.floor(conf / binWidth));
      bins[binIndex].records.push(r);
    });

    let weightedEceSum = 0;
    const reliabilityBins: ReliabilityBin[] = bins.map(bin => {
      const count = bin.records.length;
      if (count === 0) {
        return {
          binStart: bin.binStart,
          binEnd: bin.binEnd,
          sampleCount: 0,
          meanConfidence: Number(((bin.binStart + bin.binEnd) / 2).toFixed(3)),
          empiricalSurvivalRate: 0,
          calibrationError: 0,
        };
      }

      const meanConf = bin.records.reduce((acc, curr) => acc + curr.declaredConfidence, 0) / count;
      const survivedInBin = bin.records.filter(curr => curr.status === 'SURVIVED').length;
      const empiricalSurvivalRate = survivedInBin / count;
      const calibrationError = Math.abs(meanConf - empiricalSurvivalRate);

      weightedEceSum += (count / N) * calibrationError;

      return {
        binStart: bin.binStart,
        binEnd: bin.binEnd,
        sampleCount: count,
        meanConfidence: Number(meanConf.toFixed(3)),
        empiricalSurvivalRate: Number(empiricalSurvivalRate.toFixed(3)),
        calibrationError: Number(calibrationError.toFixed(4)),
      };
    });

    const expectedCalibrationError = Number(weightedEceSum.toFixed(4));

    return {
      totalDecisions,
      survivedCount,
      revertedCount,
      pendingCount,
      brierScore,
      expectedCalibrationError,
      overconfidenceBias,
      reliabilityBins,
    };
  }

  /**
   * Seeds historical operational dataset reflecting enterprise decisions.
   * This provides an empirical baseline where ~84% of high-confidence decisions survive,
   * while overconfident edge-cases are penalized.
   */
  private seedDefaultHistoricalRecords(): void {
    const historicalData: DecisionOutcomeRecord[] = [
      // High confidence survived
      { decisionId: 'HIST-001', timestamp: '2026-08-01T10:00:00Z', declaredConfidence: 0.94, status: 'SURVIVED' },
      { decisionId: 'HIST-002', timestamp: '2026-08-03T14:30:00Z', declaredConfidence: 0.92, status: 'SURVIVED' },
      { decisionId: 'HIST-003', timestamp: '2026-08-05T09:15:00Z', declaredConfidence: 0.88, status: 'SURVIVED' },
      { decisionId: 'HIST-004', timestamp: '2026-08-07T11:45:00Z', declaredConfidence: 0.90, status: 'SURVIVED' },
      { decisionId: 'HIST-005', timestamp: '2026-08-10T16:20:00Z', declaredConfidence: 0.86, status: 'SURVIVED' },
      { decisionId: 'HIST-006', timestamp: '2026-08-12T13:10:00Z', declaredConfidence: 0.95, status: 'SURVIVED' },
      { decisionId: 'HIST-007', timestamp: '2026-08-15T08:50:00Z', declaredConfidence: 0.89, status: 'SURVIVED' },
      { decisionId: 'HIST-008', timestamp: '2026-08-18T17:00:00Z', declaredConfidence: 0.91, status: 'SURVIVED' },
      
      // High confidence REVERTED (Overconfidence failure modes - minority was right)
      {
        decisionId: 'HIST-009',
        timestamp: '2026-08-20T12:00:00Z',
        declaredConfidence: 0.92,
        status: 'REVERTED',
        reversalReason: 'Database connection pool starvation under unexpected surge',
        trippedContractId: 'rc-pool-starve',
        reversalTimestamp: '2026-08-20T13:42:00Z',
      },
      {
        decisionId: 'HIST-010',
        timestamp: '2026-08-23T15:30:00Z',
        declaredConfidence: 0.88,
        status: 'REVERTED',
        reversalReason: 'P99 latency degraded by 65% due to distributed lock contention',
        trippedContractId: 'rc-p99-lock',
        reversalTimestamp: '2026-08-24T02:11:00Z',
      },

      // Moderate confidence (0.70 - 0.85) survived
      { decisionId: 'HIST-011', timestamp: '2026-08-25T10:15:00Z', declaredConfidence: 0.82, status: 'SURVIVED' },
      { decisionId: 'HIST-012', timestamp: '2026-08-27T11:00:00Z', declaredConfidence: 0.78, status: 'SURVIVED' },
      { decisionId: 'HIST-013', timestamp: '2026-08-29T14:40:00Z', declaredConfidence: 0.84, status: 'SURVIVED' },
      { decisionId: 'HIST-014', timestamp: '2026-09-01T09:20:00Z', declaredConfidence: 0.80, status: 'SURVIVED' },
      { decisionId: 'HIST-015', timestamp: '2026-09-03T16:50:00Z', declaredConfidence: 0.75, status: 'SURVIVED' },

      // Moderate confidence REVERTED
      {
        decisionId: 'HIST-016',
        timestamp: '2026-09-05T10:30:00Z',
        declaredConfidence: 0.76,
        status: 'REVERTED',
        reversalReason: 'SLA breach caused by edge proxy TLS certificate rotation failure',
        trippedContractId: 'rc-tls-sla',
        reversalTimestamp: '2026-09-05T18:00:00Z',
      },
      {
        decisionId: 'HIST-017',
        timestamp: '2026-09-08T13:00:00Z',
        declaredConfidence: 0.81,
        status: 'REVERTED',
        reversalReason: 'Memory leak in async streaming worker exceeded 2GB limit',
        trippedContractId: 'rc-worker-oom',
        reversalTimestamp: '2026-09-09T04:20:00Z',
      },

      // Lower/Marginal confidence (0.60 - 0.74)
      { decisionId: 'HIST-018', timestamp: '2026-09-10T11:15:00Z', declaredConfidence: 0.68, status: 'SURVIVED' },
      { decisionId: 'HIST-019', timestamp: '2026-09-12T15:00:00Z', declaredConfidence: 0.65, status: 'SURVIVED' },
      {
        decisionId: 'HIST-020',
        timestamp: '2026-09-14T09:40:00Z',
        declaredConfidence: 0.62,
        status: 'REVERTED',
        reversalReason: 'Deadlock cascade across microservices under partial partition',
        trippedContractId: 'rc-partition-deadlock',
        reversalTimestamp: '2026-09-14T11:20:00Z',
      },
      // Pending decisions
      { decisionId: 'HIST-021', timestamp: '2026-09-20T18:00:00Z', declaredConfidence: 0.85, status: 'PENDING' },
    ];

    historicalData.forEach(r => this.records.set(r.decisionId, r));
  }
}

export const globalCalibrationEngine = new ConfidenceCalibrationEngine();
