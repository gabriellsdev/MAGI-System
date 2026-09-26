import { describe, it, expect, beforeEach } from 'vitest';
import { EvidenceStore } from '../../src/knowledge/evidence-store.js';
import { SourceValidator } from '../../src/knowledge/source-validator.js';
import type { Evidence } from '../../src/knowledge/knowledge.types.js';

describe('V4 Knowledge Layer — EvidenceStore & SourceValidator', () => {
  let store: EvidenceStore;
  let validator: SourceValidator;

  beforeEach(() => {
    validator = new SourceValidator();
    store = new EvidenceStore(validator);
  });

  it('should validate and score official documentation sources with high reliability', () => {
    const res = validator.validate('https://kubernetes.io/docs/concepts/', 'DOCUMENT', 'Valid architecture documentation content');
    expect(res.isValid).toBe(true);
    expect(res.reliabilityScore).toBeGreaterThanOrEqual(0.85);
    expect(res.category).toBe('OFFICIAL_DOC');
  });

  it('should validate database telemetry and experiments with empirical reliability', () => {
    const res = validator.validate('pg_stat_database', 'DATABASE', 'Cache hit rate 99.2%');
    expect(res.isValid).toBe(true);
    expect(res.reliabilityScore).toBeGreaterThanOrEqual(0.92);
    expect(res.category).toBe('DATABASE_OR_EXPERIMENT');
  });

  it('should flag suspect or empty sources', () => {
    const res = validator.validate('', 'WEB');
    expect(res.isValid).toBe(false);
    expect(res.category).toBe('SUSPECT_SOURCE');
    expect(res.flags).toContain('EMPTY_SOURCE');
  });

  it('should flag social forum sources as anecdotal', () => {
    const res = validator.validate('https://reddit.com/r/programming/comments/123', 'WEB', 'Personal opinion');
    expect(res.reliabilityScore).toBeLessThanOrEqual(0.60);
    expect(res.category).toBe('UNVERIFIED_SOURCE');
    expect(res.flags).toContain('ANECDOTAL_SOURCE');
  });

  it('should add evidence to store and calculate average reliability accurately', () => {
    const ev1: Evidence = {
      id: 'ev-1',
      source: 'https://postgresql.org/docs/16/runtime-config.html',
      content: 'Shared buffers should typically be 25% of system RAM.',
      type: 'DOCUMENT',
      reliability: 0.95,
      timestamp: new Date(),
      claims: [
        { statement: 'Shared buffers optimal at 25% RAM', type: 'FACT', confidence: 0.95, requiresEvidence: false },
      ],
      tags: ['postgres', 'memory'],
    };

    const ev2: Evidence = {
      id: 'ev-2',
      source: 'internal_benchmarks',
      content: 'Benchmark proved 12ms p99 response time under 10k QPS.',
      type: 'EXPERIMENT',
      reliability: 0.98,
      timestamp: new Date(),
      claims: [
        { statement: 'p99 is 12ms under 10k QPS', type: 'FACT', confidence: 0.98, requiresEvidence: false },
      ],
      tags: ['benchmark', 'latency'],
    };

    store.addMany([ev1, ev2]);
    expect(store.count).toBe(2);
    expect(store.getAverageReliability()).toBeCloseTo((0.95 + 0.98) / 2, 2);

    const retrieved = store.getById('ev-1');
    expect(retrieved?.source).toBe('https://postgresql.org/docs/16/runtime-config.html');
  });

  it('should filter evidence by type and minimum reliability', () => {
    store.addEvidence({
      id: 'e1',
      source: 'rfc-1234.md',
      content: 'RFC standard',
      type: 'DOCUMENT',
      reliability: 0.95,
      timestamp: new Date(),
      claims: [],
      tags: ['rfc'],
    });

    store.addEvidence({
      id: 'e2',
      source: 'forum.example.com',
      content: 'Forum tip',
      type: 'WEB',
      reliability: 0.45,
      timestamp: new Date(),
      claims: [],
      tags: ['forum'],
    });

    const docs = store.find({ types: ['DOCUMENT'] });
    expect(docs.length).toBe(1);
    expect(docs[0].id).toBe('e1');

    const highQuality = store.find({ minReliability: 0.8 });
    expect(highQuality.length).toBe(1);
    expect(highQuality[0].id).toBe('e1');
  });

  it('should format deliberation brief cleanly', () => {
    store.addEvidence({
      id: 'test-ev',
      source: 'docs/architecture.md',
      content: 'Service must maintain zero data-loss guarantees.',
      type: 'DOCUMENT',
      reliability: 0.95,
      timestamp: new Date(),
      claims: [{ statement: 'Zero data-loss guaranteed', type: 'FACT', confidence: 1.0, requiresEvidence: false }],
    });

    const formatted = store.formatForDeliberation();
    expect(formatted).toContain('KNOWLEDGE LAYER EVIDENCE REPOSITORY');
    expect(formatted).toContain('docs/architecture.md');
    expect(formatted).toContain('Zero data-loss guaranteed');
  });
});
