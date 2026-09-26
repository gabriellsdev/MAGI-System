import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { createMagiSystem } from '../index.js';
import { MockLanguageModelProvider } from '../providers/mock/mock.provider.js';
import {
  getThematicFixture,
} from '../providers/mock/fixtures.js';
import { GeminiProvider } from '../providers/gemini/gemini.provider.js';
import { DEFAULT_GEMINI_MODEL } from '../providers/gemini/gemini.config.js';
import { CachedProvider } from '../providers/cache/cached.provider.js';
import type { ILanguageModelProvider } from '../providers/provider.interface.js';
import { STANDARD_BENCHMARK_SUITE } from './benchmark.suites.js';
import { loadAllBenchmarks } from './benchmark-loader.js';
import type {
  BenchmarkCategory,
  BenchmarkDilemma,
  BenchmarkScorecard,
  BenchmarkSuiteSummary,
} from './benchmark.types.js';

export interface BenchmarkRunnerOptions {
  dilemmas?: BenchmarkDilemma[];
  category?: BenchmarkCategory;
  limit?: number;
  useMock?: boolean;
  useCache?: boolean;
  saveReport?: boolean;
  verbose?: boolean;
}

export async function runBenchmarkSuite(
  options: BenchmarkRunnerOptions = {}
): Promise<BenchmarkSuiteSummary> {
  let dilemmas = options.dilemmas;

  if (!dilemmas) {
    try {
      dilemmas = await loadAllBenchmarks({
        category: options.category,
        limit: options.limit,
      });
    } catch {
      // Fallback to in-memory standard suite if benchmarks directory is unavailable
      dilemmas = STANDARD_BENCHMARK_SUITE;
      if (options.limit && options.limit > 0) {
        dilemmas = dilemmas.slice(0, options.limit);
      }
    }
  }

  const isMock = options.useMock ?? (!process.env.GEMINI_API_KEY);
  const useCache = options.useCache ?? true;
  const scorecards: BenchmarkScorecard[] = [];
  const startSuiteTime = Date.now();

  let cachedProviderWrapper: CachedProvider | null = null;

  for (const dilemma of dilemmas) {
    let baseProvider: ILanguageModelProvider;
    if (isMock) {
      const mock = new MockLanguageModelProvider();
      const fixture = getThematicFixture(dilemma.question);

      mock.onGenerate(req => {
        if (req.schemaName === 'MagiSynthesisOutput') {
          return fixture.synthesis;
        }

        const isRound1 = req.systemInstruction?.includes('DELIBERATION ROUND 1');
        const isRound2 = req.systemInstruction?.includes('DELIBERATION ROUND 2');
        const fAny = fixture as any;

        if (req.systemInstruction?.includes('MELCHIOR-1')) {
          if (isRound2 && fAny.round2) return fAny.round2.MELCHIOR;
          if (isRound1 && fAny.round1) return fAny.round1.MELCHIOR;
          return (fAny.round0 || fAny.initial).MELCHIOR;
        }
        if (req.systemInstruction?.includes('BALTHASAR-2')) {
          if (isRound2 && fAny.round2) return fAny.round2.BALTHASAR;
          if (isRound1 && fAny.round1) return fAny.round1.BALTHASAR;
          return (fAny.round0 || fAny.initial).BALTHASAR;
        }
        if (req.systemInstruction?.includes('CASPER-3')) {
          if (isRound2 && fAny.round2) return fAny.round2.CASPER;
          if (isRound1 && fAny.round1) return fAny.round1.CASPER;
          return (fAny.round0 || fAny.initial).CASPER;
        }

        return undefined;
      });
      baseProvider = mock;
    } else {
      baseProvider = new GeminiProvider({ defaultModel: DEFAULT_GEMINI_MODEL });
    }

    let finalProvider: ILanguageModelProvider = baseProvider;
    if (useCache) {
      if (!cachedProviderWrapper) {
        cachedProviderWrapper = new CachedProvider(baseProvider);
      }
      finalProvider = cachedProviderWrapper;
    }

    const magi = createMagiSystem({ provider: finalProvider });
    const dilemmaStart = Date.now();
    const result = await magi.run(dilemma.question);
    const durationMs = Date.now() - dilemmaStart;

    scorecards.push({
      dilemmaId: dilemma.id,
      title: dilemma.title,
      category: dilemma.category,
      finalDecision: result.finalDecision,
      roundsCount: result.deliberationRoundsCount,
      qualityScores: result.argumentQualityScore,
      durationMs,
      coreVerdict: result.coreVerdict,
    });
  }

  const totalDilemmas = scorecards.length;
  const consensusCount = scorecards.filter(
    s => s.finalDecision === 'CONSENSUS_REACHED' || s.finalDecision === 'CONDITIONAL_PASS'
  ).length;

  const totalRounds = scorecards.reduce((acc, s) => acc + s.roundsCount, 0);
  const totalDuration = Date.now() - startSuiteTime;

  const summary: BenchmarkSuiteSummary = {
    timestamp: new Date().toISOString(),
    totalDilemmas,
    consensusRate: totalDilemmas > 0 ? consensusCount / totalDilemmas : 0,
    averageRounds: totalDilemmas > 0 ? parseFloat((totalRounds / totalDilemmas).toFixed(2)) : 0,
    averageDurationMs: totalDilemmas > 0 ? Math.round(totalDuration / totalDilemmas) : 0,
    cacheStats: cachedProviderWrapper ? cachedProviderWrapper.getStats() : undefined,
    scorecards,
  };

  if (options.saveReport) {
    try {
      const resultsDir = path.resolve(process.cwd(), 'results');
      if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
      }
      const reportPath = path.join(resultsDir, 'benchmark-results.json');
      fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2), 'utf-8');
    } catch {
      // Best effort saving
    }
  }

  return summary;
}

// CLI Execution if invoked directly
if (process.argv[1]?.endsWith('benchmark-runner.ts') || process.argv[1]?.endsWith('benchmark-runner.js')) {
  (async () => {
    console.log('\n' + '='.repeat(75));
    console.log('  \x1b[1m\x1b[35mMAGI SUPERCOMPUTER // V3 BENCHMARK & EVALUATION ENGINE\x1b[0m');
    console.log('='.repeat(75) + '\n');

    const args = process.argv.slice(2);
    const limitArg = args.find(a => a.startsWith('--limit='));
    const categoryArg = args.find(a => a.startsWith('--category='));
    const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : (args.includes('--all') ? undefined : 4);
    const category = categoryArg ? (categoryArg.split('=')[1] as BenchmarkCategory) : undefined;
    const noCache = args.includes('--no-cache');
    const isMockCli = args.includes('--mock');

    const summary = await runBenchmarkSuite({
      limit,
      category,
      useMock: isMockCli ? true : undefined,
      useCache: !noCache,
      saveReport: true,
    });

    console.log(`\x1b[1mTOTAL DILEMMAS EVALUATED:\x1b[0m ${summary.totalDilemmas}`);
    console.log(`\x1b[1mCONSENSUS RESOLUTION RATE:\x1b[0m ${(summary.consensusRate * 100).toFixed(0)}%`);
    console.log(`\x1b[1mAVG DELIBERATION ROUNDS:\x1b[0m  ${summary.averageRounds}`);
    console.log(`\x1b[1mAVG EXECUTION TIME:\x1b[0m       ${summary.averageDurationMs} ms`);
    if (summary.cacheStats) {
      console.log(`\x1b[1mCACHE STATS:\x1b[0m              Hits: ${summary.cacheStats.hits} | Misses: ${summary.cacheStats.misses} | Tokens Saved: ${summary.cacheStats.tokensSaved}`);
    }
    console.log('');

    console.log('-'.repeat(75));
    console.log('  DILEMMA SCORECARDS');
    console.log('-'.repeat(75));

    summary.scorecards.forEach(sc => {
      console.log(`\n\x1b[36m[${sc.category}]\x1b[0m \x1b[1m${sc.title}\x1b[0m`);
      console.log(`  Decision: \x1b[32m${sc.finalDecision}\x1b[0m | Rounds: ${sc.roundsCount} | Time: ${sc.durationMs}ms`);
      console.log(`  Scores: Melchior=${sc.qualityScores.MELCHIOR}/10 | Balthasar=${sc.qualityScores.BALTHASAR}/10 | Casper=${sc.qualityScores.CASPER}/10`);
      console.log(`  Verdict: ${sc.coreVerdict}`);
    });

    console.log('\n' + '='.repeat(75) + '\n');
  })().catch(err => {
    console.error('Benchmark error:', err);
    process.exit(1);
  });
}

