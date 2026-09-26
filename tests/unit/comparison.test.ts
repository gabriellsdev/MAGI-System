import { describe, it, expect } from 'vitest';
import { runComparison } from '../../src/comparison/comparison-engine.js';

describe('Comparison Engine (Single Gemini vs MAGI Triad - V1.3)', () => {
  it('should compare single baseline with MAGI deliberation for Evangelion society dilemma', async () => {
    const question = 'How effective would a Magi supercomputer run society actually be?';
    const report = await runComparison(question, { useMock: true });

    expect(report).toBeDefined();
    expect(report.question).toBe(question);

    // 1. Single Baseline validation
    expect(report.singleBaseline).toBeDefined();
    expect(report.singleBaseline.model).toContain('gemini');
    expect(report.singleBaseline.pros.length).toBeGreaterThan(0);
    expect(report.singleBaseline.cons.length).toBeGreaterThan(0);
    expect(report.singleBaseline.verdict).toBeDefined();
    expect(report.singleBaseline.summary).toBeDefined();

    // 2. MAGI Deliberation Triad validation
    expect(report.magiResult).toBeDefined();
    expect(report.magiResult.finalDecision).toBeDefined();
    expect(report.magiResult.initialAnalysis.MELCHIOR).toBeDefined();
    expect(report.magiResult.initialAnalysis.BALTHASAR).toBeDefined();
    expect(report.magiResult.initialAnalysis.CASPER).toBeDefined();
    expect(report.magiResult.coreVerdict).toBeDefined();

    // 3. Differential calculation validation
    expect(report.differential).toBeDefined();
    expect(report.differential.perspectivesCount.single).toBe(1);
    expect(report.differential.perspectivesCount.magi).toBe(4);
    expect(report.differential.unmitigatedRisksCaughtByMagi.length).toBeGreaterThan(0);
    expect(report.differential.alternativeCompromisesIntroduced.length).toBeGreaterThan(0);
    expect(report.differential.epistemicAuditQualityAvg).toBeGreaterThanOrEqual(1);
    expect(report.differential.epistemicAuditQualityAvg).toBeLessThanOrEqual(10);
  });

  it('should fall back gracefully to default fixture comparison on arbitrary questions', async () => {
    const question = 'Should we refactor the payment gateway architecture?';
    const report = await runComparison(question, { useMock: true });

    expect(report.differential.perspectivesCount.single).toBe(1);
    expect(report.differential.perspectivesCount.magi).toBe(4);
    expect(report.singleBaseline.summary).toBeDefined();
    expect(report.magiResult.finalDecision).toBeDefined();
  });
});
