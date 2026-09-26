import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import type { BenchmarkCategory, BenchmarkDilemma } from './benchmark.types.js';

export const BenchmarkDilemmaSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: z.enum([
    'SYSTEM_ARCHITECTURE',
    'TROUBLESHOOTING',
    'ENGINEERING_DECISION',
    'INFRASTRUCTURE_PLANNING',
    'SOCIETAL_GOVERNANCE',
    'AUTONOMOUS_RISK',
    'ETHICAL_DILEMMA',
    'ADVERSARIAL_TRAP',
  ]),
  question: z.string().min(5),
  description: z.string().min(10),
  expectedConflict: z.string().min(5),
  keyTradeoffs: z.array(z.string()).optional(),
  split: z.enum(['dev', 'held_out']).optional(),
});

export const BenchmarkSuiteFileSchema = z.array(BenchmarkDilemmaSchema);

export interface BenchmarkFilterOptions {
  category?: BenchmarkCategory;
  ids?: string[];
  limit?: number;
  dirPath?: string;
  split?: 'dev' | 'held_out';
}

export function getDefaultBenchmarksDir(): string {
  return path.resolve(process.cwd(), 'benchmarks');
}

/**
 * Loads and validates all benchmark dilemmas from the benchmarks/ directory.
 */
export async function loadAllBenchmarks(
  options: BenchmarkFilterOptions = {}
): Promise<BenchmarkDilemma[]> {
  const dir = options.dirPath || getDefaultBenchmarksDir();

  if (!fs.existsSync(dir)) {
    throw new Error(`Benchmarks directory not found at: ${dir}`);
  }

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  const allDilemmas: BenchmarkDilemma[] = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      const validated = BenchmarkSuiteFileSchema.parse(parsed);
      allDilemmas.push(...(validated as BenchmarkDilemma[]));
    } catch (err: any) {
      throw new Error(`Failed to load and validate benchmark file ${file}: ${err.message}`);
    }
  }

  let filtered = allDilemmas;

  if (options.category) {
    filtered = filtered.filter(d => d.category === options.category);
  }

  if (options.split) {
    const { partitionBenchmarkDataset } = await import('./dataset-partitioner.js');
    const partition = partitionBenchmarkDataset(filtered);
    filtered = options.split === 'dev' ? partition.devSet : partition.heldOutSet;
  }

  if (options.ids && options.ids.length > 0) {
    const idSet = new Set(options.ids);
    filtered = filtered.filter(d => idSet.has(d.id));
  }

  if (options.limit && options.limit > 0) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}

/**
 * Loads a single benchmark dilemma by ID.
 */
export async function loadBenchmarkById(
  id: string,
  dirPath?: string
): Promise<BenchmarkDilemma | undefined> {
  const all = await loadAllBenchmarks({ dirPath });
  return all.find(d => d.id === id);
}

/**
 * Returns summary statistics of the benchmark catalog.
 */
export async function getBenchmarkStats(dirPath?: string): Promise<{
  total: number;
  byCategory: Record<string, number>;
  files: string[];
}> {
  const dir = dirPath || getDefaultBenchmarksDir();
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.json')) : [];
  const all = await loadAllBenchmarks({ dirPath });

  const byCategory: Record<string, number> = {};
  for (const d of all) {
    byCategory[d.category] = (byCategory[d.category] || 0) + 1;
  }

  return {
    total: all.length,
    byCategory,
    files,
  };
}
