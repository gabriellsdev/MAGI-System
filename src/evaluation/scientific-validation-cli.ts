import 'dotenv/config';
import { runScientificValidation } from './scientific-validation-runner.js';
import type { BenchmarkCategory, BenchmarkSplit } from '../benchmark/benchmark.types.js';

function parseArgs() {
  const args = process.argv.slice(2);
  let limit: number | undefined;
  let category: BenchmarkCategory | undefined;
  let split: BenchmarkSplit | undefined;
  let useMock = false;
  let useCache = true;
  let judgeCount = 3;
  let saveReport = true;

  for (const arg of args) {
    if (arg.startsWith('--limit=')) {
      limit = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--category=')) {
      category = arg.split('=')[1] as BenchmarkCategory;
    } else if (arg === '--dev-only') {
      split = 'dev';
    } else if (arg === '--held-out-only') {
      split = 'held_out';
    } else if (arg === '--adversarial-only') {
      category = 'ADVERSARIAL_TRAP';
    } else if (arg === '--mock') {
      useMock = true;
    } else if (arg === '--no-cache') {
      useCache = false;
    } else if (arg.startsWith('--judges=')) {
      judgeCount = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--no-save') {
      saveReport = false;
    } else if (arg === '--all') {
      limit = undefined;
    }
  }

  // Default to limit=5 if not specified and not --all
  if (limit === undefined && !args.includes('--all')) {
    limit = 5;
  }

  return { limit, category, split, useMock, useCache, judgeCount, saveReport };
}

async function main() {
  const options = parseArgs();

  console.log('\n================================================================================');
  console.log('       MAGI V3.4 — SCIENTIFIC VALIDATION & STATISTICAL VERIFICATION SUITE       ');
  console.log('================================================================================');
  console.log(`Parameters: limit=${options.limit ?? 'ALL (60)'}, split=${options.split || 'FULL (Dev+HeldOut)'}, category=${options.category || 'ALL'}, mock=${options.useMock}, judges=${options.judgeCount}\n`);

  const startTime = Date.now();
  const report = await runScientificValidation({
    limit: options.limit,
    category: options.category,
    split: options.split,
    useMock: options.useMock,
    useCache: options.useCache,
    judgeCount: options.judgeCount,
    saveReport: options.saveReport,
    verbose: true,
  });
  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  // ---------------------------------------------------------------------------
  // TABLE 1: Configuration Performance & Dispersion Summary
  // ---------------------------------------------------------------------------
  console.log('\n================================================================================');
  console.log(` TABLE 1: PERFORMANCE & STATISTICAL DISPERSION (${report.totalDilemmas} DILEMMAS, N=${report.multiJudgeVariance.judgeCount} JUDGES) `);
  console.log('================================================================================\n');

  console.log(
    'CONFIGURATION'.padEnd(50) +
    'SCORE (SD)'.padEnd(16) +
    '95% CI'.padEnd(20) +
    'WIN%'.padEnd(8) +
    'LATENCY'.padEnd(12) +
    'COST'.padEnd(10)
  );
  console.log(''.padEnd(116, '-'));

  for (const cfgId of report.configsEvaluated) {
    const c = report.configurations[cfgId];
    if (!c) continue;

    const mean = c.compositeStats.mean.toFixed(2);
    const sd = c.compositeStats.stdDev.toFixed(2);
    const scoreSd = `${mean} (±${sd})`;
    const ci = `[${c.compositeStats.confidenceInterval.lowerBound.toFixed(2)}, ${c.compositeStats.confidenceInterval.upperBound.toFixed(2)}]`;
    const winStr = `${(c.winRateVsSingle * 100).toFixed(0)}%`;
    const latStr = `${(c.avgLatencyMs / 1000).toFixed(1)}s`;
    const costStr = `$${c.avgCostUsd.toFixed(4)}`;

    console.log(
      c.configName.padEnd(50) +
      scoreSd.padEnd(16) +
      ci.padEnd(20) +
      winStr.padEnd(8) +
      latStr.padEnd(12) +
      costStr.padEnd(10)
    );
  }
  console.log(''.padEnd(116, '-'));

  // ---------------------------------------------------------------------------
  // TABLE 2: Paired Hypothesis Testing vs Single LLM Baseline
  // ---------------------------------------------------------------------------
  console.log('\n================================================================================');
  console.log(' TABLE 2: PAIRED HYPOTHESIS TESTING (STUDENT T-TEST VS SINGLE LLM BASELINE)     ');
  console.log('================================================================================\n');

  console.log(
    'COMPARISON TARGET'.padEnd(50) +
    'MEAN DIFF'.padEnd(14) +
    't-STAT'.padEnd(12) +
    'p-VALUE'.padEnd(12) +
    "COHEN'S d".padEnd(12) +
    'SIGNIFICANT'.padEnd(12)
  );
  console.log(''.padEnd(116, '-'));

  for (const cfgId of report.configsEvaluated) {
    if (cfgId === 'SINGLE_LLM') continue;
    const test = report.pairedHypothesisTestsVsSingle[cfgId];
    if (!test) continue;

    const diffStr = test.meanDiff >= 0 ? `+${test.meanDiff.toFixed(2)}` : test.meanDiff.toFixed(2);
    const tStr = test.tStatistic.toFixed(2);
    const pStr = test.pValueApprox < 0.001 ? '<0.001' : test.pValueApprox.toFixed(4);
    const dStr = test.cohensD.toFixed(2);
    const sigStr = test.isSignificant ? '[p < 0.05]*' : '[n.s.]';

    console.log(
      report.configurations[cfgId].configName.padEnd(50) +
      diffStr.padEnd(14) +
      tStr.padEnd(12) +
      pStr.padEnd(12) +
      dStr.padEnd(12) +
      sigStr.padEnd(12)
    );
  }
  console.log(''.padEnd(116, '-'));

  // Stepwise Breakdown
  console.log('\n[STEPWISE MARGINAL GAINS]:');
  for (const [stepName, tTest] of Object.entries(report.stepwiseMarginalGains)) {
    const diffStr = tTest.meanDiff >= 0 ? `+${tTest.meanDiff.toFixed(2)}` : tTest.meanDiff.toFixed(2);
    const sigTag = tTest.isSignificant ? '[STAT_SIGNIFICANT]' : '[SUB_THRESHOLD]';
    console.log(`  * ${stepName.padEnd(52)} : ${diffStr} pts (t=${tTest.tStatistic.toFixed(2)}, d=${tTest.cohensD.toFixed(2)}) ${sigTag}`);
  }

  // ---------------------------------------------------------------------------
  // TABLE 3: Generalization Analysis (Dev vs Held-Out Test Set)
  // ---------------------------------------------------------------------------
  console.log('\n================================================================================');
  console.log(` TABLE 3: GENERALIZATION ANALYSIS (${report.devDilemmasCount} DEV vs ${report.heldOutDilemmasCount} HELD-OUT DILEMMAS)             `);
  console.log('================================================================================\n');

  console.log(
    'CONFIGURATION'.padEnd(50) +
    'DEV MEAN (SD)'.padEnd(18) +
    'HELD-OUT (SD)'.padEnd(18) +
    'GAP (Δ_gen)'.padEnd(14) +
    'STATUS'.padEnd(12)
  );
  console.log(''.padEnd(116, '-'));

  for (const cfgId of report.configsEvaluated) {
    const gen = report.generalizationAnalysis[cfgId];
    if (!gen) continue;

    const devStr = `${gen.devMean.toFixed(2)} (±${gen.devStdDev.toFixed(2)})`;
    const heldOutStr = `${gen.heldOutMean.toFixed(2)} (±${gen.heldOutStdDev.toFixed(2)})`;
    const gapStr = gen.generalizationGap >= 0 ? `+${gen.generalizationGap.toFixed(2)}` : gen.generalizationGap.toFixed(2);
    const statusStr = gen.isOverfitting ? '[OVERFITTING]' : '[GENERALIZED]';

    console.log(
      gen.configName.padEnd(50) +
      devStr.padEnd(18) +
      heldOutStr.padEnd(18) +
      gapStr.padEnd(14) +
      statusStr.padEnd(12)
    );
  }
  console.log(''.padEnd(116, '-'));

  // ---------------------------------------------------------------------------
  // TABLE 4: Adversarial Safety & Trap Avoidance Analysis
  // ---------------------------------------------------------------------------
  console.log('\n================================================================================');
  console.log(` TABLE 4: ADVERSARIAL TRAP BENCHMARK (${report.adversarialDilemmasCount} ADVERSARIAL TRAP DILEMMAS)        `);
  console.log('================================================================================\n');

  console.log(
    'CONFIGURATION'.padEnd(50) +
    'TRAP AVOID %'.padEnd(16) +
    'EPISTEMIC HALT'.padEnd(18) +
    'MINORITY SAVED'.padEnd(16) +
    'VULNERABILITY'.padEnd(14)
  );
  console.log(''.padEnd(116, '-'));

  for (const cfgId of report.configsEvaluated) {
    const adv = report.adversarialSafety[cfgId];
    if (!adv || adv.totalTraps === 0) continue;

    const avoidStr = `${(adv.trapAvoidanceRate * 100).toFixed(0)}% (${adv.trapsAvoidedCount}/${adv.totalTraps})`;
    const haltStr = `${(adv.epistemicHaltRate * 100).toFixed(0)}%`;
    const minStr = `${(adv.minorityPreservationRate * 100).toFixed(0)}%`;
    const vulnStr = adv.vulnerabilityIndex.toFixed(2);

    console.log(
      adv.configName.padEnd(50) +
      avoidStr.padEnd(16) +
      haltStr.padEnd(18) +
      minStr.padEnd(16) +
      vulnStr.padEnd(14)
    );
  }
  console.log(''.padEnd(116, '-'));

  // ---------------------------------------------------------------------------
  // TABLE 5: Multi-Judge Agreement & High-Variance Controversial Dilemmas
  // ---------------------------------------------------------------------------
  console.log('\n================================================================================');
  console.log(' TABLE 5: MULTI-JUDGE ENSEMBLE CONSENSUS & DISPERSION ANALYSIS                 ');
  console.log('================================================================================\n');

  const mj = report.multiJudgeVariance;
  console.log(`Multi-Judge Ensemble Size:     N=${mj.judgeCount} independent evaluations`);
  console.log(`Overall Consensus Agreement:  ${(mj.overallAgreementRate * 100).toFixed(1)}% unanimous/majority consensus`);
  console.log(`High-Variance Questions Rate: ${(mj.highVarianceRate * 100).toFixed(1)}% (${mj.highVarianceCount} questions with σ >= 0.75)`);
  console.log(`Average Rubric Dispersion:     Reasoning σ=${mj.averageStdDevByRubric.reasoningQuality}, Completeness σ=${mj.averageStdDevByRubric.completeness}, Robustness σ=${mj.averageStdDevByRubric.robustness}, Actionability σ=${mj.averageStdDevByRubric.actionability}\n`);

  if (mj.controversialDilemmas.length > 0) {
    console.log('IDENTIFIED HIGH-VARIANCE CONTROVERSIAL DILEMMAS (INTER-JUDGE DIVERGENCE):');
    console.log(
      'DILEMMA ID'.padEnd(34) +
      'SPLIT'.padEnd(10) +
      'MAX σ'.padEnd(10) +
      'COMPOSITE σ'.padEnd(14) +
      'TITLE'
    );
    console.log(''.padEnd(100, '-'));
    for (const d of mj.controversialDilemmas.slice(0, 5)) {
      console.log(
        d.dilemmaId.padEnd(34) +
        `[${d.split.toUpperCase()}]`.padEnd(10) +
        d.maxStdDev.toFixed(2).padEnd(10) +
        d.rubricStdDevs.composite.toFixed(2).padEnd(14) +
        d.title.slice(0, 40)
      );
    }
  }

  console.log('\n================================================================================');
  console.log(`Scientific validation completed in ${durationSec}s.`);
  console.log('Full JSON report written to: results/scientific-validation-report.json');
  console.log('================================================================================\n');
}

main().catch(err => {
  console.error('[Scientific Validation Error]:', err);
  process.exit(1);
});
