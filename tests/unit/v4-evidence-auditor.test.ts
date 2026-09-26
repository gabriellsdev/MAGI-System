import { describe, it, expect, beforeEach } from 'vitest';
import { EvidenceAuditor } from '../../src/deliberation/evidence-auditor.js';
import { EvidenceStore } from '../../src/knowledge/evidence-store.js';
import type { EvidenceChallenge } from '../../src/domain/types.js';

describe('V4.1 EvidenceAuditor — Verifying Challenges against Knowledge Layer', () => {
  let auditor: EvidenceAuditor;
  let evidenceStore: EvidenceStore;

  beforeEach(() => {
    auditor = new EvidenceAuditor();
    evidenceStore = new EvidenceStore();
  });

  it('should mark challenge as SUPPORTED when empirical evidence exists in store', () => {
    evidenceStore.addEvidence({
      id: 'ev-pg-1',
      source: 'pg_stat_database',
      content: 'Shared buffers hit rate is 99.4% and active connections average 42.',
      type: 'DATABASE',
      reliability: 0.98,
      timestamp: new Date(),
      claims: [
        { statement: 'Shared buffers hit rate is 99.4%', type: 'FACT', confidence: 0.98, requiresEvidence: false },
      ],
    });

    const challenge: EvidenceChallenge = {
      id: 'ch-1',
      challengingAgent: 'BALTHASAR',
      targetAgent: 'MELCHIOR',
      targetClaim: 'Shared buffers hit rate is 99.4%',
      question: 'What empirical metric proves this cache hit rate?',
      status: 'PENDING',
    };

    const result = auditor.auditChallenges([challenge], evidenceStore);
    expect(result.auditedChallenges.length).toBe(1);
    expect(result.auditedChallenges[0].status).toBe('SUPPORTED');
    expect(result.auditedChallenges[0].supportingEvidenceId).toBe('ev-pg-1');
    expect(result.agentReports.MELCHIOR.supportedClaimsCount).toBe(1);
    expect(result.agentReports.MELCHIOR.scoreModifier).toBeGreaterThan(0);
  });

  it('should mark challenge as UNSUPPORTED when no evidence exists in store', () => {
    const challenge: EvidenceChallenge = {
      id: 'ch-2',
      challengingAgent: 'CASPER',
      targetAgent: 'MELCHIOR',
      targetClaim: 'The team can complete the migration within 48 hours without friction.',
      question: 'Where is the empirical velocity evidence that our team can complete this in 48 hours?',
      status: 'PENDING',
    };

    const result = auditor.auditChallenges([challenge], evidenceStore);
    expect(result.auditedChallenges[0].status).toBe('UNSUPPORTED');
    expect(result.auditedChallenges[0].supportingEvidenceId).toBeUndefined();
    expect(result.agentReports.MELCHIOR.unsupportedClaimsCount).toBe(1);
    expect(result.agentReports.MELCHIOR.scoreModifier).toBeLessThan(0);
  });

  it('should mark challenge as REFUTED when telemetry contradicts the assertion', () => {
    evidenceStore.addEvidence({
      id: 'ev-mongo-1',
      source: 'https://mongodb.com/docs/manual/core/transactions/',
      content: 'MongoDB trade strict consistency for write throughput and does not provide full distributed ACID across un-sharded multi-collections.',
      type: 'WEB',
      reliability: 0.90,
      timestamp: new Date(),
      claims: [],
    });

    const challenge: EvidenceChallenge = {
      id: 'ch-3',
      challengingAgent: 'BALTHASAR',
      targetAgent: 'MELCHIOR',
      targetClaim: 'MongoDB guarantees full acid compliance with zero trade-offs.',
      question: 'Which official spec claims full acid compliance without trade-offs?',
      status: 'PENDING',
    };

    const result = auditor.auditChallenges([challenge], evidenceStore);
    expect(result.auditedChallenges[0].status).toBe('REFUTED');
    expect(result.agentReports.MELCHIOR.refutedClaimsCount).toBe(1);
    expect(result.agentReports.MELCHIOR.scoreModifier).toBeLessThanOrEqual(-2.0);
  });
});
