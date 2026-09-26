import { describe, it, expect, beforeEach } from 'vitest';
import { AgentReputationRegistry } from '../../src/memory/agent-reputation-registry.js';
import { MagiCore } from '../../src/deliberation/magi-core.js';
import { MockLanguageModelProvider } from '../../src/providers/mock/mock.provider.js';
import type { AgentStructuredOutput } from '../../src/domain/types.js';

describe('Balthasar False Alarm Dampener & Calibration (V4.4)', () => {
  let registry: AgentReputationRegistry;

  beforeEach(() => {
    registry = new AgentReputationRegistry(true); // empty clean registry
  });

  it('should initialize with zero false alarm rate and 1.0 dampener multiplier', () => {
    const far = registry.getFalseAlarmRate('BALTHASAR');
    const dampener = registry.getFalseAlarmDampener('BALTHASAR');

    expect(far).toBe(0);
    expect(dampener).toBe(1.0);
  });

  it('should apply rebalanced penalties on false alarm (-0.15 base, -0.25 domain)', () => {
    const profileBefore = registry.getProfile('BALTHASAR');
    expect(profileBefore?.baseReputation).toBe(7.0);

    // Decision survived cleanly, but Balthasar was dissenting -> false alarm
    registry.recordSurvival('DEC-TEST-1', 'SECURITY', 'BALTHASAR');

    const profileAfter = registry.getProfile('BALTHASAR');
    expect(profileAfter?.falseAlarms).toBe(1);
    expect(profileAfter?.baseReputation).toBe(6.85); // 7.0 - 0.15

    const domainRec = profileAfter?.domainReputations['SECURITY'];
    expect(domainRec).toBeDefined();
    expect(domainRec?.score).toBe(6.75); // 7.0 - 0.25
  });

  it('should degrade false alarm dampener when false alarm rate breaches 35%', () => {
    // 1 vindication, 3 false alarms -> FAR = 3 / 4 = 0.75 > 0.35
    registry.applyPostMortem({
      decisionId: 'DEC-VIND-1',
      analysisTimestamp: new Date().toISOString(),
      originalDecision: 'CONDITIONAL_PASS',
      declaredConfidence: 0.9,
      dissentingAgent: 'BALTHASAR',
      reversalReason: 'Memory leak',
      minorityVindicated: true,
      minorityVindicationScore: 0.95,
      rootCauseAttribution: 'Memory leak',
      majorityFlaw: 'Overconfidence',
      recommendedAdjustments: ['Fix memory leak'],
      agentReputationDeltas: { MELCHIOR: -0.5, BALTHASAR: 1.0, CASPER: -0.2 },
    }, 'DATABASE');

    registry.recordSurvival('DEC-SURV-1', 'DATABASE', 'BALTHASAR');
    registry.recordSurvival('DEC-SURV-2', 'DATABASE', 'BALTHASAR');
    registry.recordSurvival('DEC-SURV-3', 'DATABASE', 'BALTHASAR');

    const far = registry.getFalseAlarmRate('BALTHASAR');
    expect(far).toBe(0.75); // 3 false alarms / 4 total alarms

    const dampener = registry.getFalseAlarmDampener('BALTHASAR');
    expect(dampener).toBeLessThan(1.0);
    expect(dampener).toBeGreaterThanOrEqual(0.40);
    expect(dampener).toBe(0.52); // 1.0 - (0.75 - 0.35) * 1.2 = 1.0 - 0.48 = 0.52
  });

  it('should demote speculative ungrounded veto to CONDITIONAL_PASS when Balthasar is dampened', async () => {
    // Set up heavily dampened Balthasar in registry
    for (let i = 0; i < 4; i++) {
      registry.recordSurvival(`DEC-SURV-${i}`, 'GENERAL', 'BALTHASAR');
    }
    const dampener = registry.getFalseAlarmDampener('BALTHASAR');
    expect(dampener).toBeLessThan(0.85);

    const mockProvider = new MockLanguageModelProvider();
    mockProvider.onGenerate(() => ({
      finalDecision: 'REJECTED',
      coreVerdict: 'Rejection based on Balthasar alarm',
      synthesisSummary: 'Comprehensive synthesis summary',
      argumentQualityScore: { MELCHIOR: 8, BALTHASAR: 6, CASPER: 8 },
      decisiveFactors: ['Catastrophic risk concern'],
      dissentingOpinionsNoted: ['Balthasar concerns'],
      epistemicAudit: {
        factCount: 2,
        unverifiedAssumptionsCount: 1,
        evidenceConfidenceScore: 7,
        strongestEvidenceAgent: 'MELCHIOR',
      },
    }));

    const magiCore = new MagiCore(mockProvider);

    const initialAnalysis: Record<string, AgentStructuredOutput> = {
      MELCHIOR: {
        agentId: 'MELCHIOR',
        stance: 'APPROVE',
        confidence: 0.9,
        summary: 'Technically sound',
        keyArguments: ['Scalable'],
        criticalAssumptions: [],
        identifiedRisks: [],
        recommendedAction: 'Proceed',
      },
      BALTHASAR: {
        agentId: 'BALTHASAR',
        stance: 'REJECT',
        confidence: 0.85,
        summary: 'Vague speculative tail risk',
        keyArguments: ['System could fail in abstract way'],
        criticalAssumptions: ['Assumes hardware could fail'],
        identifiedRisks: ['Abstract fragility'],
        recommendedAction: 'Halt all development',
        claims: [
          { statement: 'Abstract risk', type: 'SPECULATION', confidence: 0.6, requiresEvidence: true },
        ], // ZERO empirical FACT claims!
      },
      CASPER: {
        agentId: 'CASPER',
        stance: 'APPROVE',
        confidence: 0.8,
        summary: 'Good team alignment',
        keyArguments: ['User centric'],
        criticalAssumptions: [],
        identifiedRisks: [],
        recommendedAction: 'Adopt',
      },
    };

    const result = await magiCore.synthesize(
      'Should we adopt new compression library?',
      initialAnalysis,
      [],
      { reputationRegistry: registry }
    );

    // Unilateral speculative rejection was demoted to CONDITIONAL_PASS to avoid paralysis
    expect(result.finalDecision).toBe('CONDITIONAL_PASS');
    expect(result.coreVerdict).toContain('[CALIBRATED PASS]');
    expect(result.decisiveFactors[0]).toContain('[CALIBRATED DAMPENER]');
  });

  it('should preserve Balthasar veto when empirical FACT claims are present, even if dampened', async () => {
    // Set up dampened Balthasar
    for (let i = 0; i < 4; i++) {
      registry.recordSurvival(`DEC-SURV-${i}`, 'GENERAL', 'BALTHASAR');
    }

    const mockProvider = new MockLanguageModelProvider();
    mockProvider.onGenerate(() => ({
      finalDecision: 'REJECTED',
      coreVerdict: 'Rejection based on proven memory corruption vulnerability',
      synthesisSummary: 'Comprehensive synthesis summary on cryptographic vulnerability',
      argumentQualityScore: { MELCHIOR: 7, BALTHASAR: 9, CASPER: 6 },
      decisiveFactors: ['Demonstrated buffer overrun in cryptographic cipher'],
      dissentingOpinionsNoted: [],
      epistemicAudit: {
        factCount: 4,
        unverifiedAssumptionsCount: 0,
        evidenceConfidenceScore: 9,
        strongestEvidenceAgent: 'BALTHASAR',
      },
    }));

    const magiCore = new MagiCore(mockProvider);

    const initialAnalysis: Record<string, AgentStructuredOutput> = {
      MELCHIOR: {
        agentId: 'MELCHIOR',
        stance: 'APPROVE',
        confidence: 0.85,
        summary: 'Fast cryptographic throughput',
        keyArguments: ['Speed'],
        criticalAssumptions: [],
        identifiedRisks: [],
        recommendedAction: 'Deploy',
      },
      BALTHASAR: {
        agentId: 'BALTHASAR',
        stance: 'REJECT',
        confidence: 0.95,
        summary: 'Proved buffer overflow CVE in underlying C binding',
        keyArguments: ['Demonstrable memory corruption vulnerability'],
        criticalAssumptions: [],
        identifiedRisks: ['Remote code execution'],
        recommendedAction: 'Strict reject',
        claims: [
          { statement: 'CVE-2026-4412 exists in upstream C library', type: 'FACT', confidence: 0.99, requiresEvidence: false },
        ], // Demonstrable FACT claim!
      },
      CASPER: {
        agentId: 'CASPER',
        stance: 'APPROVE',
        confidence: 0.8,
        summary: 'Great performance gains',
        keyArguments: ['UX'],
        criticalAssumptions: [],
        identifiedRisks: [],
        recommendedAction: 'Proceed',
      },
    };

    const result = await magiCore.synthesize(
      'Should we link the unverified C cryptographic binding?',
      initialAnalysis,
      [],
      { reputationRegistry: registry }
    );

    // Veto preserved because empirical FACT was demonstrated!
    expect(result.finalDecision).toBe('REJECTED');
    expect(result.coreVerdict).toContain('Rejection based on proven memory corruption vulnerability');
  });
});
