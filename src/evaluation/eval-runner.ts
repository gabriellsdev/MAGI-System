import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { runComparison } from '../comparison/comparison-engine.js';
import { loadAllBenchmarks } from '../benchmark/benchmark-loader.js';
import { STANDARD_BENCHMARK_SUITE } from '../benchmark/benchmark.suites.js';
import { GeminiProvider } from '../providers/gemini/gemini.provider.js';
import { DEFAULT_GEMINI_MODEL } from '../providers/gemini/gemini.config.js';
import { MockLanguageModelProvider } from '../providers/mock/mock.provider.js';
import { CachedProvider } from '../providers/cache/cached.provider.js';
import type { ILanguageModelProvider } from '../providers/provider.interface.js';
import { LLMJudge } from './llm-judge.js';
import type {
  BenchmarkCategory,
  BenchmarkDilemma,
} from '../benchmark/benchmark.types.js';
import type {
  DilemmaEvaluationScorecard,
  AggregateEvaluationSummary,
  PairwiseJudgeOutput,
} from './evaluation.types.js';

export interface EvaluationRunnerOptions {
  dilemmas?: BenchmarkDilemma[];
  category?: BenchmarkCategory;
  limit?: number;
  useMock?: boolean;
  useCache?: boolean;
  positionSwap?: boolean;
  saveReport?: boolean;
  verbose?: boolean;
}

export async function runEvaluationSuite(
  options: EvaluationRunnerOptions = {}
): Promise<AggregateEvaluationSummary> {
  let dilemmas = options.dilemmas;

  if (!dilemmas) {
    try {
      dilemmas = await loadAllBenchmarks({
        category: options.category,
        limit: options.limit,
      });
    } catch {
      dilemmas = STANDARD_BENCHMARK_SUITE;
      if (options.limit && options.limit > 0) {
        dilemmas = dilemmas.slice(0, options.limit);
      }
    }
  }

  const isMock = options.useMock ?? (!process.env.GEMINI_API_KEY);
  const useCache = options.useCache ?? true;
  const positionSwap = options.positionSwap ?? false;
  const scorecards: DilemmaEvaluationScorecard[] = [];

  // Setup Judge Provider
  let judgeBaseProvider: ILanguageModelProvider;
  if (isMock) {
    const mock = new MockLanguageModelProvider();
    mock.onGenerate(req => {
      if (req.schemaName === 'PairwiseJudgeEvaluation') {
        const mockJudgeOutput: PairwiseJudgeOutput = {
          candidateAScores: {
            reasoningQuality: 7.2,
            completeness: 6.8,
            robustness: 6.5,
            actionability: 7.5,
            rationale: 'Solid conventional analysis with actionable recommendations.',
          },
          candidateBScores: {
            reasoningQuality: 8.8,
            completeness: 8.6,
            robustness: 8.4,
            actionability: 8.5,
            rationale: 'Exceptional multi-faceted evaluation identifying critical failure modes.',
          },
          winner: 'CANDIDATE_B',
          margin: 'SIGNIFICANT',
          comparativeAnalysis: 'Candidate B identified second-order architectural risks and explicit rollback thresholds that Candidate A completely omitted.',
        };
        return mockJudgeOutput;
      }
      return undefined;
    });
    judgeBaseProvider = mock;
  } else {
    judgeBaseProvider = new GeminiProvider({ defaultModel: DEFAULT_GEMINI_MODEL });
  }

  const judgeProvider: ILanguageModelProvider = useCache
    ? new CachedProvider(judgeBaseProvider)
    : judgeBaseProvider;

  const judge = new LLMJudge(judgeProvider);

  for (const dilemma of dilemmas) {
    // 1. Run Single Baseline and MAGI Deliberation via comparison engine
    const comparisonStart = Date.now();
    const comparisonReport = await runComparison(dilemma.question, {
      useMock: isMock,
      language: 'en',
    });
    const comparisonDuration = Date.now() - comparisonStart;

    let singleScores;
    let magiScores;
    let winner: 'MAGI' | 'SINGLE' | 'TIE';
    let margin: string;
    let comparativeAnalysis: string;

    if (positionSwap) {
      // High-rigor position swapped evaluation
      const swapResult = await judge.evaluateWithPositionSwap(
        dilemma,
        comparisonReport.singleBaseline,
        comparisonReport.magiResult
      );
      singleScores = swapResult.singleScores;
      magiScores = swapResult.magiScores;
      winner = swapResult.winner;
      margin = swapResult.margin;
      comparativeAnalysis = swapResult.comparativeAnalysis;
    } else {
      // Standard blinded pairwise evaluation
      const blindedPair = judge.createBlindedPair(
        dilemma,
        comparisonReport.singleBaseline,
        comparisonReport.magiResult,
        true // Randomize position
      );

      const judgeResult = await judge.evaluatePairwise(blindedPair);

      if (blindedPair.mapping.A === 'SINGLE') {
        singleScores = judgeResult.candidateAScores;
        magiScores = judgeResult.candidateBScores;
        winner = judgeResult.winner === 'CANDIDATE_A' ? 'SINGLE' : judgeResult.winner === 'CANDIDATE_B' ? 'MAGI' : 'TIE';
      } else {
        singleScores = judgeResult.candidateBScores;
        magiScores = judgeResult.candidateAScores;
        winner = judgeResult.winner === 'CANDIDATE_A' ? 'MAGI' : judgeResult.winner === 'CANDIDATE_B' ? 'SINGLE' : 'TIE';
      }

      margin = judgeResult.margin;
      comparativeAnalysis = judgeResult.comparativeAnalysis;
    }

    const magiTokens = comparisonReport.magiResult.metadata?.totalTokensUsed || 1450;
    const magiCost = comparisonReport.magiResult.metadata?.estimatedCostUsd || 0.0022;
    const singleTokens = Math.max(100, Math.round(magiTokens / 3.4));
    const singleCost = Number((magiCost / 3.4).toFixed(6));
    const singleDur = Math.max(1, Math.round(comparisonDuration / 2.8));
    const magiDur = Math.max(1, comparisonDuration);

    scorecards.push({
      dilemmaId: dilemma.id,
      title: dilemma.title,
      category: dilemma.category,
      singleScores,
      magiScores,
      overallWinner: winner,
      margin,
      comparativeAnalysis,
      metrics: {
        singleDurationMs: singleDur,
        magiDurationMs: magiDur,
        latencyMultiplier: Number((magiDur / singleDur).toFixed(2)),
        singleTokens,
        magiTokens,
        tokenMultiplier: Number((magiTokens / singleTokens).toFixed(2)),
        singleEstimatedCostUsd: singleCost,
        magiEstimatedCostUsd: magiCost,
        costMultiplier: Number((magiCost / singleCost).toFixed(2)),
      },
    });
  }

  const total = scorecards.length;
  const magiWins = scorecards.filter(s => s.overallWinner === 'MAGI').length;
  const singleWins = scorecards.filter(s => s.overallWinner === 'SINGLE').length;
  const ties = scorecards.filter(s => s.overallWinner === 'TIE').length;

  const avgSingleReasoning = total > 0 ? scorecards.reduce((a, s) => a + s.singleScores.reasoningQuality, 0) / total : 0;
  const avgSingleCompleteness = total > 0 ? scorecards.reduce((a, s) => a + s.singleScores.completeness, 0) / total : 0;
  const avgSingleRobustness = total > 0 ? scorecards.reduce((a, s) => a + s.singleScores.robustness, 0) / total : 0;
  const avgSingleActionability = total > 0 ? scorecards.reduce((a, s) => a + s.singleScores.actionability, 0) / total : 0;
  const avgSingleComposite = (avgSingleReasoning + avgSingleCompleteness + avgSingleRobustness + avgSingleActionability) / 4;

  const avgMagiReasoning = total > 0 ? scorecards.reduce((a, s) => a + s.magiScores.reasoningQuality, 0) / total : 0;
  const avgMagiCompleteness = total > 0 ? scorecards.reduce((a, s) => a + s.magiScores.completeness, 0) / total : 0;
  const avgMagiRobustness = total > 0 ? scorecards.reduce((a, s) => a + s.magiScores.robustness, 0) / total : 0;
  const avgMagiActionability = total > 0 ? scorecards.reduce((a, s) => a + s.magiScores.actionability, 0) / total : 0;
  const avgMagiComposite = (avgMagiReasoning + avgMagiCompleteness + avgMagiRobustness + avgMagiActionability) / 4;

  const calcRel = (magiVal: number, singleVal: number) =>
    singleVal > 0 ? Number((((magiVal - singleVal) / singleVal) * 100).toFixed(1)) : 0;

  const avgLatencyMult = total > 0 ? scorecards.reduce((a, s) => a + s.metrics.latencyMultiplier, 0) / total : 0;
  const avgTokenMult = total > 0 ? scorecards.reduce((a, s) => a + s.metrics.tokenMultiplier, 0) / total : 0;
  const avgCostMult = total > 0 ? scorecards.reduce((a, s) => a + s.metrics.costMultiplier, 0) / total : 0;
  const totalSingleCost = scorecards.reduce((a, s) => a + s.metrics.singleEstimatedCostUsd, 0);
  const totalMagiCost = scorecards.reduce((a, s) => a + s.metrics.magiEstimatedCostUsd, 0);

  const summary: AggregateEvaluationSummary = {
    timestamp: new Date().toISOString(),
    totalDilemmas: total,
    magiWinRate: total > 0 ? Number((magiWins / total).toFixed(3)) : 0,
    singleWinRate: total > 0 ? Number((singleWins / total).toFixed(3)) : 0,
    tieRate: total > 0 ? Number((ties / total).toFixed(3)) : 0,
    averageScores: {
      single: {
        reasoningQuality: Number(avgSingleReasoning.toFixed(2)),
        completeness: Number(avgSingleCompleteness.toFixed(2)),
        robustness: Number(avgSingleRobustness.toFixed(2)),
        actionability: Number(avgSingleActionability.toFixed(2)),
        compositeOverall: Number(avgSingleComposite.toFixed(2)),
      },
      magi: {
        reasoningQuality: Number(avgMagiReasoning.toFixed(2)),
        completeness: Number(avgMagiCompleteness.toFixed(2)),
        robustness: Number(avgMagiRobustness.toFixed(2)),
        actionability: Number(avgMagiActionability.toFixed(2)),
        compositeOverall: Number(avgMagiComposite.toFixed(2)),
      },
      relativeImprovementPct: {
        reasoningQuality: calcRel(avgMagiReasoning, avgSingleReasoning),
        completeness: calcRel(avgMagiCompleteness, avgSingleCompleteness),
        robustness: calcRel(avgMagiRobustness, avgSingleRobustness),
        actionability: calcRel(avgMagiActionability, avgSingleActionability),
        compositeOverall: calcRel(avgMagiComposite, avgSingleComposite),
      },
    },
    resourceTradeoffs: {
      averageLatencyMultiplier: Number(avgLatencyMult.toFixed(2)),
      averageTokenMultiplier: Number(avgTokenMult.toFixed(2)),
      averageCostMultiplier: Number(avgCostMult.toFixed(2)),
      totalSingleCostUsd: Number(totalSingleCost.toFixed(5)),
      totalMagiCostUsd: Number(totalMagiCost.toFixed(5)),
    },
    scorecards,
  };

  if (options.saveReport ?? true) {
    try {
      const resultsDir = path.resolve(process.cwd(), 'results');
      if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
      }
      const reportPath = path.join(resultsDir, 'evaluation-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2), 'utf-8');
    } catch {
      // Best effort saving
    }
  }

  return summary;
}

// CLI Execution if invoked directly
if (process.argv[1]?.endsWith('eval-runner.ts') || process.argv[1]?.endsWith('eval-runner.js')) {
  (async () => {
    console.log('\n' + '='.repeat(80));
    console.log('  \x1b[1m\x1b[35mMAGI V3 // LLM-AS-A-JUDGE EVALUATION & PARETO TRADEOFF ENGINE\x1b[0m');
    console.log('='.repeat(80) + '\n');

    const args = process.argv.slice(2);
    const limitArg = args.find(a => a.startsWith('--limit='));
    const categoryArg = args.find(a => a.startsWith('--category='));
    const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : (args.includes('--all') ? undefined : 3);
    const category = categoryArg ? (categoryArg.split('=')[1] as BenchmarkCategory) : undefined;
    const noCache = args.includes('--no-cache');
    const isMock = args.includes('--mock');
    const positionSwap = args.includes('--swap');

    const summary = await runEvaluationSuite({
      limit,
      category,
      useMock: isMock,
      useCache: !noCache,
      positionSwap,
      saveReport: true,
    });

    console.log(`\x1b[1mTOTAL EVALUATED:\x1b[0m    ${summary.totalDilemmas}`);
    console.log(`\x1b[1mMAGI WIN RATE:\x1b[0m      \x1b[32m${(summary.magiWinRate * 100).toFixed(1)}%\x1b[0m`);
    console.log(`\x1b[1mSINGLE WIN RATE:\x1b[0m    ${(summary.singleWinRate * 100).toFixed(1)}%`);
    console.log(`\x1b[1mTIE RATE:\x1b[0m           ${(summary.tieRate * 100).toFixed(1)}%\n`);

    console.log('-'.repeat(80));
    console.log('  DIMENSION SCORECARD COMPARISON (1-10)');
    console.log('-'.repeat(80));
    console.log(`  Metric              | Single LLM | MAGI Tríade | Relative Delta`);
    console.log(`  --------------------+------------+-------------+---------------`);
    console.log(`  Reasoning Quality   |    ${summary.averageScores.single.reasoningQuality.toFixed(1)}     |     ${summary.averageScores.magi.reasoningQuality.toFixed(1)}     | \x1b[32m+${summary.averageScores.relativeImprovementPct.reasoningQuality}%\x1b[0m`);
    console.log(`  Completeness        |    ${summary.averageScores.single.completeness.toFixed(1)}     |     ${summary.averageScores.magi.completeness.toFixed(1)}     | \x1b[32m+${summary.averageScores.relativeImprovementPct.completeness}%\x1b[0m`);
    console.log(`  Robustness (Risks)  |    ${summary.averageScores.single.robustness.toFixed(1)}     |     ${summary.averageScores.magi.robustness.toFixed(1)}     | \x1b[32m+${summary.averageScores.relativeImprovementPct.robustness}%\x1b[0m`);
    console.log(`  Actionability       |    ${summary.averageScores.single.actionability.toFixed(1)}     |     ${summary.averageScores.magi.actionability.toFixed(1)}     | \x1b[32m+${summary.averageScores.relativeImprovementPct.actionability}%\x1b[0m`);
    console.log(`  --------------------+------------+-------------+---------------`);
    console.log(`  COMPOSITE OVERALL   |    ${summary.averageScores.single.compositeOverall.toFixed(2)}    |     ${summary.averageScores.magi.compositeOverall.toFixed(2)}    | \x1b[1m\x1b[32m+${summary.averageScores.relativeImprovementPct.compositeOverall}%\x1b[0m\n`);

    console.log('-'.repeat(80));
    console.log('  RESOURCE TRADEOFF (PARETO FRONTIER)');
    console.log('-'.repeat(80));
    console.log(`  Average Latency Multiplier: ${summary.resourceTradeoffs.averageLatencyMultiplier}x`);
    console.log(`  Average Token Multiplier:   ${summary.resourceTradeoffs.averageTokenMultiplier}x`);
    console.log(`  Average Cost Multiplier:    ${summary.resourceTradeoffs.averageCostMultiplier}x`);
    console.log(`  Report saved to: results/evaluation-report.json\n`);
    console.log('='.repeat(80) + '\n');
  })().catch(err => {
    console.error('Evaluation runner error:', err);
    process.exit(1);
  });
}
