import { describe, it, expect, beforeEach } from 'vitest';
import { ConfidenceCalibrationEngine } from '../../src/calibration/calibration-engine.js';
import type { DecisionOutcomeRecord } from '../../src/domain/types.js';

describe('V3.4 Confidence Calibration Engine (Brier Score & ECE)', () => {
  let engine: ConfidenceCalibrationEngine;

  beforeEach(() => {
    engine = new ConfidenceCalibrationEngine();
    engine.reset(true); // empty reset
  });

  it('should compute exact Brier Score on controlled distribution', () => {
    // Decision 1: conf 0.8, survived (1) -> (0.8 - 1)^2 = 0.04
    // Decision 2: conf 0.6, reverted (0) -> (0.6 - 0)^2 = 0.36
    // Expected Brier Score: (0.04 + 0.36) / 2 = 0.2000
    engine.recordOutcome({
      decisionId: 'T-1',
      timestamp: '2026-09-20T00:00:00Z',
      declaredConfidence: 0.8,
      status: 'SURVIVED',
    });
    engine.recordOutcome({
      decisionId: 'T-2',
      timestamp: '2026-09-20T01:00:00Z',
      declaredConfidence: 0.6,
      status: 'REVERTED',
    });

    const report = engine.computeCalibrationReport(5);

    expect(report.totalDecisions).toBe(2);
    expect(report.survivedCount).toBe(1);
    expect(report.revertedCount).toBe(1);
    expect(report.brierScore).toBe(0.2000);
    // Mean confidence: 0.70, Mean outcome: 0.50 -> Overconfidence Bias: +0.2000
    expect(report.overconfidenceBias).toBe(0.2000);
  });

  it('should return 0.0000 Brier Score for perfectly calibrated clairvoyant decisions', () => {
    engine.recordOutcome({
      decisionId: 'P-1',
      timestamp: '2026-09-20T00:00:00Z',
      declaredConfidence: 1.0,
      status: 'SURVIVED',
    });
    engine.recordOutcome({
      decisionId: 'P-2',
      timestamp: '2026-09-20T01:00:00Z',
      declaredConfidence: 0.0,
      status: 'REVERTED',
    });

    const report = engine.computeCalibrationReport();
    expect(report.brierScore).toBe(0.0000);
    expect(report.overconfidenceBias).toBe(0.0000);
  });

  it('should calculate Expected Calibration Error (ECE) across reliability bins', () => {
    // 4 decisions in [0.8-1.0] bin: mean conf 0.90, 3 survived (75% survival rate) -> error |0.90 - 0.75| = 0.15
    engine.recordOutcome({ decisionId: 'E-1', timestamp: '2026-09-20T00:00:00Z', declaredConfidence: 0.90, status: 'SURVIVED' });
    engine.recordOutcome({ decisionId: 'E-2', timestamp: '2026-09-20T00:00:00Z', declaredConfidence: 0.90, status: 'SURVIVED' });
    engine.recordOutcome({ decisionId: 'E-3', timestamp: '2026-09-20T00:00:00Z', declaredConfidence: 0.90, status: 'SURVIVED' });
    engine.recordOutcome({ decisionId: 'E-4', timestamp: '2026-09-20T00:00:00Z', declaredConfidence: 0.90, status: 'REVERTED' });

    const report = engine.computeCalibrationReport(5);

    expect(report.expectedCalibrationError).toBe(0.1500);
    const topBin = report.reliabilityBins.find(b => b.binStart === 0.80);
    expect(topBin).toBeDefined();
    expect(topBin?.sampleCount).toBe(4);
    expect(topBin?.meanConfidence).toBe(0.90);
    expect(topBin?.empiricalSurvivalRate).toBe(0.75);
    expect(topBin?.calibrationError).toBe(0.15);
  });

  it('should exclude pending decisions from Brier score calculation', () => {
    engine.recordOutcome({ decisionId: 'R-1', timestamp: '2026-09-20T00:00:00Z', declaredConfidence: 0.90, status: 'SURVIVED' });
    engine.recordOutcome({ decisionId: 'PEND-1', timestamp: '2026-09-20T00:00:00Z', declaredConfidence: 0.85, status: 'PENDING' });

    const report = engine.computeCalibrationReport();
    expect(report.totalDecisions).toBe(2);
    expect(report.pendingCount).toBe(1);
    expect(report.survivedCount).toBe(1);
    expect(report.brierScore).toBe(0.0100); // (0.90 - 1.0)^2 = 0.01
  });
});
