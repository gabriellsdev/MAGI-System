import { describe, it, expect, beforeEach } from 'vitest';
import { MagiDatasetBuilder } from '../../src/distillation/dataset-builder.js';
import { DecisionMemoryStore } from '../../src/memory/decision-memory.js';
import { EvidenceStore } from '../../src/knowledge/evidence-store.js';

describe('MagiDatasetBuilder (V4.3)', () => {
  let builder: MagiDatasetBuilder;
  let memory: DecisionMemoryStore;
  let evidenceStore: EvidenceStore;

  beforeEach(() => {
    memory = new DecisionMemoryStore({}, false); // pre-seeded
    evidenceStore = new EvidenceStore();
    evidenceStore.addEvidence({
      id: 'ev-test-1',
      type: 'DATABASE',
      source: 'telemetry://db-pool',
      content: 'Database connection pool peak handle exhaustion under surge.',
      reliability: 0.95,
      timestamp: new Date(),
    });

    builder = new MagiDatasetBuilder({ decisionMemory: memory, evidenceStore });
  });

  it('should compile dataset entries from stored decision memory', () => {
    const entries = builder.buildDataset();
    expect(entries.length).toBeGreaterThanOrEqual(3);

    const first = entries[0];
    expect(first.id).toBeDefined();
    expect(first.problem).toBeDefined();
    expect(first.domain).toBeDefined();
    expect(first.synthesis.finalDecision).toBeDefined();
    expect(first.qualityScore).toBeGreaterThan(0.5);
  });

  it('should filter dataset by quality and domain criteria', () => {
    const dbEntries = builder.buildDataset({ domains: ['DATABASE'] });
    expect(dbEntries.length).toBeGreaterThanOrEqual(1);
    expect(dbEntries.every(e => e.domain === 'DATABASE')).toBe(true);

    const highQuality = builder.buildDataset({ minQualityScore: 0.75 });
    expect(highQuality.every(e => e.qualityScore >= 0.75)).toBe(true);
  });

  it('should export valid SFT JSONL format', () => {
    const sftJsonl = builder.exportSft();
    const lines = sftJsonl.split('\n').filter(l => l.trim().length > 0);
    expect(lines.length).toBeGreaterThanOrEqual(3);

    lines.forEach(line => {
      const parsed = JSON.parse(line);
      expect(parsed.instruction).toContain('MAGI');
      expect(parsed.input).toBeDefined();
      expect(parsed.output).toBeDefined();
      expect(parsed.messages).toBeDefined();
      expect(parsed.messages).toHaveLength(3);
    });
  });

  it('should export valid DPO preference pairs JSONL format', () => {
    const dpoJsonl = builder.exportDpo();
    const lines = dpoJsonl.split('\n').filter(l => l.trim().length > 0);
    expect(lines.length).toBeGreaterThanOrEqual(3);

    lines.forEach(line => {
      const parsed = JSON.parse(line);
      expect(parsed.prompt).toBeDefined();
      expect(parsed.chosen).toBeDefined();
      expect(parsed.rejected).toBeDefined();
      expect(parsed.margin).toBeGreaterThanOrEqual(0.3);

      const chosenParsed = JSON.parse(parsed.chosen);
      expect(chosenParsed.verdict).toBeDefined();
      expect(chosenParsed.minoritySafeguard).toBeDefined();

      const rejectedParsed = JSON.parse(parsed.rejected);
      expect(rejectedParsed.flaw).toBeDefined();
    });
  });

  it('should export valid ShareGPT conversational format', () => {
    const shareGptJsonl = builder.exportShareGpt();
    const lines = shareGptJsonl.split('\n').filter(l => l.trim().length > 0);
    expect(lines.length).toBeGreaterThanOrEqual(3);

    lines.forEach(line => {
      const parsed = JSON.parse(line);
      expect(parsed.id).toBeDefined();
      expect(parsed.conversations).toHaveLength(2);
      expect(parsed.conversations[0].from).toBe('human');
      expect(parsed.conversations[1].from).toBe('gpt');
      expect(parsed.conversations[1].value).toContain('[MAGI SYNTHESIS');
    });
  });

  it('should compute comprehensive dataset statistics', () => {
    const stats = builder.getDatasetStats();
    expect(stats.totalEntries).toBeGreaterThanOrEqual(3);
    expect(stats.sftSamples).toBe(stats.totalEntries);
    expect(stats.dpoPairs).toBe(stats.totalEntries);
    expect(stats.averageQualityScore).toBeGreaterThan(0.6);
    expect(stats.estimatedTokens).toBeGreaterThan(500);
    expect(Object.keys(stats.domainDistribution).length).toBeGreaterThanOrEqual(2);
  });
});
