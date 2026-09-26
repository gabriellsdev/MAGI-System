import { describe, it, expect } from 'vitest';
import { loadAllBenchmarks } from '../../src/benchmark/benchmark-loader.js';
import {
  partitionBenchmarkDataset,
  getDevelopmentSet,
  getHeldOutSet,
  isHeldOutDilemma,
} from '../../src/benchmark/dataset-partitioner.js';

describe('Dataset Partitioner (Dev vs Held-Out Isolation)', () => {
  it('partitions full 60 benchmark catalog into 40 dev and 20 held-out dilemmas', async () => {
    const all = await loadAllBenchmarks();
    expect(all.length).toBe(60);

    const partition = partitionBenchmarkDataset(all);
    expect(partition.devCount).toBe(40);
    expect(partition.heldOutCount).toBe(20);
    expect(partition.devSet.length).toBe(40);
    expect(partition.heldOutSet.length).toBe(20);

    // Verify zero overlap (strict isolation)
    const devIds = new Set(partition.devSet.map(d => d.id));
    const heldOutIds = new Set(partition.heldOutSet.map(d => d.id));

    expect(devIds.size).toBe(40);
    expect(heldOutIds.size).toBe(20);

    for (const id of heldOutIds) {
      expect(devIds.has(id)).toBe(false);
    }
  });

  it('maintains strict category stratification', async () => {
    const all = await loadAllBenchmarks();
    const partition = partitionBenchmarkDataset(all);

    // 10 adversarial traps -> 5 dev, 5 held-out
    expect(partition.byCategory['ADVERSARIAL_TRAP']).toEqual({
      dev: 5,
      heldOut: 5,
      total: 10,
    });

    expect(partition.byCategory['SYSTEM_ARCHITECTURE']).toEqual({
      dev: 8,
      heldOut: 4,
      total: 12,
    });

    expect(partition.byCategory['TROUBLESHOOTING']).toEqual({
      dev: 7,
      heldOut: 3,
      total: 10,
    });

    expect(partition.byCategory['ENGINEERING_DECISION']).toEqual({
      dev: 9,
      heldOut: 5,
      total: 14,
    });

    expect(partition.byCategory['INFRASTRUCTURE_PLANNING']).toEqual({
      dev: 7,
      heldOut: 3,
      total: 10,
    });
  });

  it('is deterministic across multiple runs', async () => {
    const all = await loadAllBenchmarks();
    const p1 = partitionBenchmarkDataset(all);
    const p2 = partitionBenchmarkDataset(all);

    expect(p1.devSet.map(d => d.id)).toEqual(p2.devSet.map(d => d.id));
    expect(p1.heldOutSet.map(d => d.id)).toEqual(p2.heldOutSet.map(d => d.id));
  });

  it('loads dev and held-out sets via benchmark-loader filter options', async () => {
    const devSet = await loadAllBenchmarks({ split: 'dev' });
    const heldOutSet = await loadAllBenchmarks({ split: 'held_out' });

    expect(devSet.length).toBe(40);
    expect(heldOutSet.length).toBe(20);

    const devIds = new Set(devSet.map(d => d.id));
    const heldOutIds = new Set(heldOutSet.map(d => d.id));

    for (const id of heldOutIds) {
      expect(devIds.has(id)).toBe(false);
    }
  });

  it('identifies held-out dilemmas correctly with helper', async () => {
    const all = await loadAllBenchmarks();
    const heldOutSet = await getHeldOutSet(all);
    const devSet = await getDevelopmentSet(all);

    for (const d of heldOutSet) {
      expect(isHeldOutDilemma(d.id, all)).toBe(true);
    }
    for (const d of devSet) {
      expect(isHeldOutDilemma(d.id, all)).toBe(false);
    }
  });
});
