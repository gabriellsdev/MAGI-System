import type {
  BenchmarkCategory,
  BenchmarkDilemma,
  BenchmarkSplit,
  DatasetPartition,
} from './benchmark.types.js';
import { loadAllBenchmarks } from './benchmark-loader.js';

/**
 * Deterministically partitions benchmark dilemmas into:
 * 1. Development Set (40 dilemmas: 35 standard + 5 adversarial)
 *    - Used for model calibration, prompt refinement, and tuning.
 * 2. Held-Out Test Set (20 dilemmas: 15 standard + 5 adversarial)
 *    - Strictly isolated test set that MAGI rules/prompts have never seen.
 *
 * Maintains category stratification across all standard domains and adversarial traps.
 */
export function partitionBenchmarkDataset(
  dilemmas: BenchmarkDilemma[]
): DatasetPartition {
  const byCategoryMap = new Map<string, BenchmarkDilemma[]>();

  // Group by category
  for (const dilemma of dilemmas) {
    const list = byCategoryMap.get(dilemma.category) || [];
    list.push(dilemma);
    byCategoryMap.set(dilemma.category, list);
  }

  const targetTotalHeldOut = Math.round(dilemmas.length / 3);
  const targetPerCategory: Record<string, number> = {};

  // Compute baseline allocation per category
  let allocatedHeldOut = 0;
  for (const [cat, catDilemmas] of byCategoryMap.entries()) {
    const total = catDilemmas.length;
    let heldOut = 0;
    if (cat === 'ADVERSARIAL_TRAP') {
      heldOut = Math.floor(total / 2); // 5 out of 10
    } else if (total >= 4) {
      heldOut = Math.round(total / 3);
    } else {
      heldOut = 0; // Keep singletons/pairs in dev
    }
    targetPerCategory[cat] = heldOut;
    allocatedHeldOut += heldOut;
  }

  // Adjust any discrepancy to hit exact targetTotalHeldOut
  while (allocatedHeldOut < targetTotalHeldOut) {
    // Add to largest category
    let maxCat = '';
    let maxRemaining = -1;
    for (const [cat, catDilemmas] of byCategoryMap.entries()) {
      const remaining = catDilemmas.length - targetPerCategory[cat];
      if (remaining > maxRemaining) {
        maxRemaining = remaining;
        maxCat = cat;
      }
    }
    if (maxCat && maxRemaining > 0) {
      targetPerCategory[maxCat]++;
      allocatedHeldOut++;
    } else {
      break;
    }
  }

  while (allocatedHeldOut > targetTotalHeldOut) {
    // Deduct from category with highest heldOut proportion
    let maxCat = '';
    let maxHeldOut = 0;
    for (const [cat, heldOut] of Object.entries(targetPerCategory)) {
      if (cat !== 'ADVERSARIAL_TRAP' && heldOut > maxHeldOut) {
        maxHeldOut = heldOut;
        maxCat = cat;
      }
    }
    if (maxCat && maxHeldOut > 0) {
      targetPerCategory[maxCat]--;
      allocatedHeldOut--;
    } else {
      break;
    }
  }

  const devSet: BenchmarkDilemma[] = [];
  const heldOutSet: BenchmarkDilemma[] = [];
  const byCategorySummary: Record<string, { dev: number; heldOut: number; total: number }> = {};

  // For each category, sort stably by ID for deterministic partition
  for (const [cat, catDilemmas] of byCategoryMap.entries()) {
    const sorted = [...catDilemmas].sort((a, b) => a.id.localeCompare(b.id));
    const total = sorted.length;
    const targetHeldOut = targetPerCategory[cat] || 0;

    const catDev: BenchmarkDilemma[] = [];
    const catHeldOut: BenchmarkDilemma[] = [];

    // Deterministic selection: evenly interleave held-out dilemmas
    const heldOutIndices = new Set<number>();
    if (targetHeldOut > 0) {
      const step = total / targetHeldOut;
      for (let i = 0; i < targetHeldOut; i++) {
        const idx = Math.min(total - 1, Math.floor(i * step + step / 2));
        heldOutIndices.add(idx);
      }
      for (let idx = total - 1; idx >= 0 && heldOutIndices.size < targetHeldOut; idx--) {
        heldOutIndices.add(idx);
      }
    }

    for (let i = 0; i < sorted.length; i++) {
      const item = { ...sorted[i] };
      if (heldOutIndices.has(i)) {
        item.split = 'held_out';
        catHeldOut.push(item);
        heldOutSet.push(item);
      } else {
        item.split = 'dev';
        catDev.push(item);
        devSet.push(item);
      }
    }

    byCategorySummary[cat] = {
      dev: catDev.length,
      heldOut: catHeldOut.length,
      total,
    };
  }

  return {
    devSet,
    heldOutSet,
    devCount: devSet.length,
    heldOutCount: heldOutSet.length,
    byCategory: byCategorySummary,
  };
}

/**
 * Returns the Development Set (40 dilemmas).
 */
export async function getDevelopmentSet(
  dilemmas?: BenchmarkDilemma[]
): Promise<BenchmarkDilemma[]> {
  const all = dilemmas || (await loadAllBenchmarks());
  const partition = partitionBenchmarkDataset(all);
  return partition.devSet;
}

/**
 * Returns the Held-Out Test Set (20 dilemmas).
 */
export async function getHeldOutSet(
  dilemmas?: BenchmarkDilemma[]
): Promise<BenchmarkDilemma[]> {
  const all = dilemmas || (await loadAllBenchmarks());
  const partition = partitionBenchmarkDataset(all);
  return partition.heldOutSet;
}

/**
 * Checks if a specific dilemma ID belongs to the held-out set.
 */
export function isHeldOutDilemma(dilemmaId: string, allDilemmas?: BenchmarkDilemma[]): boolean {
  if (allDilemmas) {
    const partition = partitionBenchmarkDataset(allDilemmas);
    return partition.heldOutSet.some(d => d.id === dilemmaId);
  }
  let hash = 0;
  for (let i = 0; i < dilemmaId.length; i++) {
    hash = ((hash << 5) - hash) + dilemmaId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 3 === 0;
}
