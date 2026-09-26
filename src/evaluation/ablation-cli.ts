import 'dotenv/config';
import { runAblationExperiment } from './ablation-runner.js';
import type { BenchmarkCategory } from '../benchmark/benchmark.types.js';

function parseArgs() {
  const args = process.argv.slice(2);
  let limit: number | undefined;
  let category: BenchmarkCategory | undefined;
  let useMock = false;
  let useCache = true;

  for (const arg of args) {
    if (arg.startsWith('--limit=')) {
      limit = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--category=')) {
      category = arg.split('=')[1] as BenchmarkCategory;
    } else if (arg === '--mock') {
      useMock = true;
    } else if (arg === '--no-cache') {
      useCache = false;
    } else if (arg === '--all') {
      limit = undefined;
    }
  }

  // Default to limit=3 if not specified and not --all
  if (limit === undefined && !args.includes('--all')) {
    limit = 3;
  }

  return { limit, category, useMock, useCache };
}

async function main() {
  const options = parseArgs();

  console.log('\n================================================================================');
  console.log('         MAGI V3 — ABLATION & ARCHITECTURAL EXPERIMENT SUITE                   ');
  console.log('================================================================================');
  console.log(`Parameters: limit=${options.limit ?? 'ALL'}, category=${options.category || 'ALL'}, mock=${options.useMock}, cache=${options.useCache}\n`);

  const startTime = Date.now();
  const summary = await runAblationExperiment({
    limit: options.limit,
    category: options.category,
    useMock: options.useMock,
    useCache: options.useCache,
    verbose: true,
  });
  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n================================================================================');
  console.log(`                     ABLATION STUDY RESULTS (${summary.totalDilemmas} DILEMMAS)               `);
  console.log('================================================================================\n');

  console.log(
    'CONFIGURATION'.padEnd(46) +
    'SCORE'.padStart(7) +
    'GAIN'.padStart(9) +
    'WIN%'.padStart(8) +
    'LATENCY'.padStart(14) +
    'COST'.padStart(16)
  );
  console.log(''.padEnd(100, '-'));

  const configs = summary.configsEvaluated;
  for (const cfgId of configs) {
    const s = summary.configSummaries[cfgId];
    if (!s) continue;

    const gainStr = s.marginalQualityGainVsSingle >= 0
      ? `+${s.marginalQualityGainVsSingle}%`
      : `${s.marginalQualityGainVsSingle}%`;
    const winStr = `${(s.winRateVsSingle * 100).toFixed(0)}%`;
    const latencyStr = `${(s.avgLatencyMs / 1000).toFixed(1)}s (${s.latencyMultiplierVsSingle}x)`;
    const costStr = `$${s.avgCostUsd.toFixed(4)} (${s.costMultiplierVsSingle}x)`;

    console.log(
      s.configName.padEnd(46) +
      s.overallScore.toFixed(2).padStart(7) +
      gainStr.padStart(9) +
      winStr.padStart(8) +
      latencyStr.padStart(14) +
      costStr.padStart(16)
    );
  }

  console.log(''.padEnd(100, '-'));

  // Component Contribution Breakdown
  console.log('\n📊 COMPONENT ATTRIBUTION BREAKDOWN (MARGINAL QUALITY GAINS):');
  const single = summary.configSummaries.SINGLE_LLM;
  const majority = summary.configSummaries.MAJORITY_VOTE;
  const noDelib = summary.configSummaries.NO_DELIBERATION;
  const classic = summary.configSummaries.FULL_MAGI_CLASSIC;
  const hybrid = summary.configSummaries.FULL_MAGI_HYBRID_ARBITER;

  if (single && majority) {
    const d1 = Number((majority.overallScore - single.overallScore).toFixed(2));
    console.log(`  1. Triad Role Diversity (Majority vs Single):       ${d1 >= 0 ? '+' : ''}${d1} pts (${majority.marginalQualityGainVsPrior >= 0 ? '+' : ''}${majority.marginalQualityGainVsPrior}%)`);
  }
  if (majority && noDelib) {
    const d2 = Number((noDelib.overallScore - majority.overallScore).toFixed(2));
    console.log(`  2. MAGI Core Synthesis (Core vs Majority Vote):     ${d2 >= 0 ? '+' : ''}${d2} pts (${noDelib.marginalQualityGainVsPrior >= 0 ? '+' : ''}${noDelib.marginalQualityGainVsPrior}%)`);
  }
  if (noDelib && classic) {
    const d3 = Number((classic.overallScore - noDelib.overallScore).toFixed(2));
    console.log(`  3. Peer Deliberation (Debate vs No Debate):        ${d3 >= 0 ? '+' : ''}${d3} pts (${classic.marginalQualityGainVsPrior >= 0 ? '+' : ''}${classic.marginalQualityGainVsPrior}%)`);
  }
  if (classic && hybrid) {
    const d4 = Number((hybrid.overallScore - classic.overallScore).toFixed(2));
    const tokenSavings = Number((((classic.avgTokens - hybrid.avgTokens) / (classic.avgTokens || 1)) * 100).toFixed(1));
    console.log(`  4. Two-Tier Arbiter & Audit (Hybrid vs Classic):   ${d4 >= 0 ? '+' : ''}${d4} pts | Token Efficiency: +${tokenSavings}%`);
  }

  console.log('\n================================================================================');
  console.log(`Experiment finished in ${durationSec}s. Full JSON report saved to: results/ablation-report.json`);
  console.log('================================================================================\n');
}

main().catch(err => {
  console.error('[Ablation CLI Error]:', err);
  process.exit(1);
});
