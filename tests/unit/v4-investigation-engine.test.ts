import { describe, it, expect, beforeEach } from 'vitest';
import { InvestigationEngine } from '../../src/investigation/investigation-engine.js';
import { EvidenceStore } from '../../src/knowledge/evidence-store.js';
import { ToolRegistry } from '../../src/tools/tool-registry.js';

describe('V4 Investigation Engine — Knowns, Unknowns & Hypotheses', () => {
  let engine: InvestigationEngine;
  let evidenceStore: EvidenceStore;
  let toolRegistry: ToolRegistry;

  beforeEach(() => {
    evidenceStore = new EvidenceStore();
    toolRegistry = new ToolRegistry({ evidenceStore, registerDefaults: true });
    engine = new InvestigationEngine({ evidenceStore, toolRegistry });
  });

  it('should formulate an investigation plan with knowns, unknowns, and hypotheses', async () => {
    const plan = await engine.createPlan('Should we migrate our PostgreSQL database to MongoDB?');
    expect(plan.id).toBeDefined();
    expect(plan.knowns.length).toBeGreaterThan(0);
    expect(plan.unknowns.length).toBeGreaterThan(0);
    expect(plan.neededEvidence.length).toBeGreaterThan(0);
    expect(plan.hypotheses.length).toBeGreaterThan(0);

    const blockingUnknown = plan.unknowns.find(u => u.criticality === 'BLOCKING');
    expect(blockingUnknown).toBeDefined();
    expect(blockingUnknown?.question).toContain('ACID');
  });

  it('should execute full investigation cycle, gathering empirical evidence from tools', async () => {
    const result = await engine.executeInvestigation('Should we migrate PostgreSQL to MongoDB?');
    expect(result.plan.status).toBe('COMPLETED');
    expect(result.evidenceGathered.length).toBeGreaterThan(0);
    expect(result.readinessForDeliberation).toBe('READY');

    // Hypotheses should be supported by empirical evidence
    const supported = result.plan.hypotheses.filter(h => h.status === 'SUPPORTED');
    expect(supported.length).toBeGreaterThan(0);

    // Formatted dilemma brief should contain structured sections
    expect(result.dilemmaBrief).toContain('=== MAGI V4 INVESTIGATION BRIEF ===');
    expect(result.dilemmaBrief).toContain('1. WHAT WE KNOW (KNOWN FACTS):');
    expect(result.dilemmaBrief).toContain('2. WHAT IS MISSING (UNKNOWN VARIABLES):');
    expect(result.dilemmaBrief).toContain('3. EMPIRICAL EVIDENCE COLLECTED');
  });

  it('should handle generic problems and plan web search inquiry', async () => {
    const result = await engine.executeInvestigation('How to design an idempotent webhook receiver?');
    expect(result.plan.neededEvidence.length).toBeGreaterThan(0);
    expect(result.plan.neededEvidence[0].targetTool).toBe('web_search');
    expect(result.readinessForDeliberation).toBe('READY');
  });
});
