import type { BenchmarkDilemma } from './benchmark.types.js';
import adversarialJson from '../../benchmarks/adversarial.json' with { type: 'json' };

export const ADVERSARIAL_BENCHMARK_SUITE: BenchmarkDilemma[] = adversarialJson as BenchmarkDilemma[];

export function getAdversarialDilemma(id: string): BenchmarkDilemma | undefined {
  return ADVERSARIAL_BENCHMARK_SUITE.find(d => d.id === id);
}
