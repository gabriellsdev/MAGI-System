import { describe, it, expect } from 'vitest';
import {
  loadAllBenchmarks,
  loadBenchmarkById,
  getBenchmarkStats,
} from '../../src/benchmark/benchmark-loader.js';

describe('BenchmarkLoader (V3 50-Dilemma Benchmark Suite)', () => {
  it('should successfully load and validate all 60 benchmark dilemmas', async () => {
    const dilemmas = await loadAllBenchmarks();

    expect(dilemmas.length).toBe(60);

    // Verify all items have unique IDs and required fields
    const ids = new Set<string>();
    for (const d of dilemmas) {
      expect(ids.has(d.id)).toBe(false); // No duplicate IDs
      ids.add(d.id);

      expect(d.id.length).toBeGreaterThan(3);
      expect(d.title.length).toBeGreaterThan(5);
      expect(d.question.length).toBeGreaterThan(10);
      expect(d.description.length).toBeGreaterThan(15);
      expect(d.expectedConflict.length).toBeGreaterThan(10);

      // Verify category is valid
      expect([
        'SYSTEM_ARCHITECTURE',
        'TROUBLESHOOTING',
        'ENGINEERING_DECISION',
        'INFRASTRUCTURE_PLANNING',
        'SOCIETAL_GOVERNANCE',
        'AUTONOMOUS_RISK',
        'ETHICAL_DILEMMA',
        'ADVERSARIAL_TRAP',
      ]).toContain(d.category);

      // Verify keyTradeoffs if present
      if (d.keyTradeoffs) {
        expect(Array.isArray(d.keyTradeoffs)).toBe(true);
        expect(d.keyTradeoffs.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('should filter benchmarks by category correctly', async () => {
    const archDilemmas = await loadAllBenchmarks({ category: 'SYSTEM_ARCHITECTURE' });
    expect(archDilemmas.length).toBe(12);
    expect(archDilemmas.every(d => d.category === 'SYSTEM_ARCHITECTURE')).toBe(true);

    const troubleDilemmas = await loadAllBenchmarks({ category: 'TROUBLESHOOTING' });
    expect(troubleDilemmas.length).toBe(10);
    expect(troubleDilemmas.every(d => d.category === 'TROUBLESHOOTING')).toBe(true);

    const decisionDilemmas = await loadAllBenchmarks({ category: 'ENGINEERING_DECISION' });
    expect(decisionDilemmas.length).toBe(14);
    expect(decisionDilemmas.every(d => d.category === 'ENGINEERING_DECISION')).toBe(true);

    const planningDilemmas = await loadAllBenchmarks({ category: 'INFRASTRUCTURE_PLANNING' });
    expect(planningDilemmas.length).toBe(10);
    expect(planningDilemmas.every(d => d.category === 'INFRASTRUCTURE_PLANNING')).toBe(true);
  });

  it('should find specific benchmark by ID', async () => {
    const d = await loadBenchmarkById('arch-monolith-to-microservices');
    expect(d).toBeDefined();
    expect(d?.id).toBe('arch-monolith-to-microservices');
    expect(d?.title).toContain('Monolith to Microservices');

    const nonExistent = await loadBenchmarkById('non-existent-dilemma-id');
    expect(nonExistent).toBeUndefined();
  });

  it('should return catalog statistics across categories', async () => {
    const stats = await getBenchmarkStats();

    expect(stats.total).toBe(60);
    expect(stats.files.length).toBe(6);
    expect(stats.byCategory['SYSTEM_ARCHITECTURE']).toBe(12);
    expect(stats.byCategory['TROUBLESHOOTING']).toBe(10);
    expect(stats.byCategory['ENGINEERING_DECISION']).toBe(14);
    expect(stats.byCategory['INFRASTRUCTURE_PLANNING']).toBe(10);
    expect(stats.byCategory['SOCIETAL_GOVERNANCE']).toBe(1);
    expect(stats.byCategory['AUTONOMOUS_RISK']).toBe(1);
    expect(stats.byCategory['ETHICAL_DILEMMA']).toBe(2);
    expect(stats.byCategory['ADVERSARIAL_TRAP']).toBe(10);
  });

  it('should respect limit parameter', async () => {
    const limited = await loadAllBenchmarks({ limit: 5 });
    expect(limited.length).toBe(5);
  });
});
