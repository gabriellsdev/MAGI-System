import { describe, it, expect, beforeEach } from 'vitest';
import { DecisionMemoryStore } from '../../src/memory/decision-memory.js';
import type { AuditableDecision } from '../../src/domain/types.js';

describe('DecisionMemoryStore (V4.2)', () => {
  let memory: DecisionMemoryStore;

  const mockAuditableDecision: AuditableDecision = {
    verdict: 'CONDITIONAL_PASS',
    confidence: 0.88,
    risks: [{ id: 'r1', description: 'Latency breach', severity: 'HIGH', mitigation: 'Canary testing' }],
    minorityConcern: 'Risk of database handle starvation',
    reversalConditions: ['p99_latency_ms > 500'],
    evidence: [],
    assumptions: [],
    unknowns: ['Peak concurrent traffic multiplier'],
    nextActions: [{ id: 'a1', title: 'Canary check', phase: 'CANARY', mandatoryValidation: 'Error rate < 1%' }],
    expectedOutcome: 'P99 latency < 350ms, error rate < 0.5%',
  };

  beforeEach(() => {
    memory = new DecisionMemoryStore({}, true); // empty baseline
  });

  it('should record a new auditable decision with PENDING status', () => {
    const recorded = memory.recordDecision({
      decision: mockAuditableDecision,
      problem: 'Migrate caching layer to Redis cluster',
      domain: 'INFRASTRUCTURE',
      decisionId: 'TEST-REC-001',
    });

    expect(recorded.decisionId).toBe('TEST-REC-001');
    expect(recorded.domain).toBe('INFRASTRUCTURE');
    expect(recorded.status).toBe('PENDING');
    expect(recorded.declaredConfidence).toBe(0.88);
    expect(recorded.auditableDecision.risks).toHaveLength(1);

    const retrieved = memory.getDecision('TEST-REC-001');
    expect(retrieved).toBeDefined();
    expect(retrieved?.decisionId).toBe('TEST-REC-001');
  });

  it('should query decisions by domain and status', () => {
    memory.recordDecision({
      decision: mockAuditableDecision,
      problem: 'Query 1',
      domain: 'DATABASE',
      decisionId: 'D-1',
    });
    memory.recordDecision({
      decision: mockAuditableDecision,
      problem: 'Query 2',
      domain: 'SECURITY',
      decisionId: 'D-2',
    });

    const dbDecisions = memory.queryDecisions({ domain: 'DATABASE' });
    expect(dbDecisions).toHaveLength(1);
    expect(dbDecisions[0].decisionId).toBe('D-1');

    const secDecisions = memory.queryDecisions({ domain: 'SECURITY' });
    expect(secDecisions).toHaveLength(1);
    expect(secDecisions[0].decisionId).toBe('D-2');

    const pending = memory.queryDecisions({ status: 'PENDING' });
    expect(pending).toHaveLength(2);
  });

  it('should track decision outcome with accurate survival', () => {
    memory.recordDecision({
      decision: mockAuditableDecision,
      problem: 'Database cache migration',
      domain: 'DATABASE',
      decisionId: 'DEC-SURV-01',
    });

    const result = memory.trackDecisionOutcome({
      decisionId: 'DEC-SURV-01',
      actualOutcome: 'P99 latency remained at 210ms with zero errors during peak.',
      observedMetrics: { p99_latency_ms: 210, error_rate_percent: 0.02 },
      status: 'SURVIVED',
    });

    expect(result.status).toBe('SURVIVED');
    expect(result.deltaReport.rawDelta).toBeLessThan(0.30);
    expect(result.deltaReport.matchClassification).toMatch(/ACCURATE|ACCEPTABLE/);

    const updated = memory.getDecision('DEC-SURV-01');
    expect(updated?.status).toBe('SURVIVED');
    expect(updated?.outcomeDelta).toBeDefined();
  });

  it('should track decision outcome with reversal, autopsy, and failure pattern classification', () => {
    memory.recordDecision({
      decision: mockAuditableDecision,
      problem: 'Pessimistic lock migration',
      domain: 'DATABASE',
      decisionId: 'DEC-REV-01',
    });

    const result = memory.trackDecisionOutcome({
      decisionId: 'DEC-REV-01',
      actualOutcome: 'Cascade deadlock crash with connection pool starvation.',
      observedMetrics: { p99_latency_ms: 850, error_rate_percent: 6.2 },
      status: 'REVERTED',
      reversalReason: 'Connection pool starvation and SLA breach',
      trippedContractId: 'rc-pool-1',
    });

    expect(result.status).toBe('REVERTED');
    expect(result.deltaReport.rawDelta).toBeGreaterThanOrEqual(0.70);
    expect(result.failurePattern).toBe('INVARIANT_BREACH');
    expect(result.postMortem).toBeDefined();
    expect(result.postMortem?.minorityVindicated).toBe(true);

    const updated = memory.getDecision('DEC-REV-01');
    expect(updated?.status).toBe('REVERTED');
    expect(updated?.matchClassification).toBe('FAILED');
  });

  it('should compute memory summary statistics accurately', () => {
    // Seeded memory
    const seededMemory = new DecisionMemoryStore({}, false);
    const summary = seededMemory.getMemorySummary();

    expect(summary.totalDecisions).toBeGreaterThanOrEqual(3);
    expect(summary.survivedCount).toBeGreaterThanOrEqual(1);
    expect(summary.revertedCount).toBeGreaterThanOrEqual(2);
    expect(summary.domainsRepresented).toContain('DATABASE');
    expect(summary.domainsRepresented).toContain('INFRASTRUCTURE');
  });
});
