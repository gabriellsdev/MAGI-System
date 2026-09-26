import 'dotenv/config';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import * as fs from 'node:fs/promises';
import {
  createMagiSystem,
  createLocalMagiSystem,
  createGroqFreeTierMagiSystem,
  checkOllamaHealth,
  globalInvestigationEngine,
  globalDecisionMemory,
  globalAgentReputationRegistry,
  globalDatasetBuilder,
  globalNativeModelAdapter,
  globalWebhookEngine,
  globalContractHeartbeat,
  globalStorageManager,
  type LocalDiversityPresetName,
} from '../index.js';
import { MockLanguageModelProvider } from '../providers/mock/mock.provider.js';
import { resolvedInRoundOneFixtures } from '../providers/mock/fixtures.js';
import { GeminiProvider } from '../providers/gemini/gemini.provider.js';
import { DEFAULT_GEMINI_MODEL } from '../providers/gemini/gemini.config.js';
import type { AgentStructuredOutput, DisagreementReport, MagiSynthesisResult } from '../domain/types.js';
import { globalCalibrationEngine } from '../calibration/calibration-engine.js';
import { globalReversalMonitor } from '../monitoring/reversal-monitor.js';

function formatStance(stance: string): string {
  switch (stance) {
    case 'APPROVE':
      return '\x1b[32m[APPROVE]\x1b[0m';
    case 'REJECT':
      return '\x1b[31m[REJECT]\x1b[0m';
    case 'CONDITIONAL':
      return '\x1b[33m[CONDITIONAL]\x1b[0m';
    case 'PIVOT':
      return '\x1b[36m[PIVOT]\x1b[0m';
    default:
      return `[${stance}]`;
  }
}

function printHeader(title: string) {
  console.log('\n' + '='.repeat(70));
  console.log(`  \x1b[1m\x1b[35m${title.toUpperCase()}\x1b[0m`);
  console.log('='.repeat(70));
}

function printAgentOutput(round: number, out: AgentStructuredOutput) {
  const color = out.agentId === 'MELCHIOR' ? '\x1b[34m' : out.agentId === 'BALTHASAR' ? '\x1b[33m' : '\x1b[32m';
  console.log(`\n${color}▶ ${out.agentId}-V1\x1b[0m ${formatStance(out.stance)} (Confidence: ${(out.confidence * 100).toFixed(0)}%)`);
  console.log(`  Summary: ${out.summary}`);
  console.log(`  Arguments:`);
  out.keyArguments.forEach(arg => console.log(`    • ${arg}`));
  if (out.identifiedRisks.length > 0) {
    console.log(`  Risks:`);
    out.identifiedRisks.forEach(r => console.log(`    [!] ${r}`));
  }
  if (out.critiquesOfPeers?.length) {
    console.log(`  Critiques:`);
    out.critiquesOfPeers.forEach(c => console.log(`    ↳ vs ${c.targetAgent}: ${c.rebuttal}`));
  }
}

function printHelp() {
  console.log(`
MAGI Deliberation Supercomputer System — V4.6 Cognitive Architecture

Usage:
  npx tsx src/cli/main.ts [options] ["Your question here"]

Options:
  --local                 Run local zero-cost multi-model deliberation via Ollama
  --local-preset <preset> Local diversity preset (BALANCED_8B, LIGHTWEIGHT_3B, REASONING_FOCUSED)
  --local-status          Check Ollama daemon connectivity and installed local models
  --storage-status        Display local JSON storage files and repository status
  --backup-storage <path> Backup JSON storage files to target directory (e.g. Google Drive)
  --groq                  Run deliberation using Groq / Production Core models
  --mock                  Run hermetic offline mock mode with fixture responses
  --json                  Output raw structured JSON to stdout
  --distilled             Run single-pass unified distilled inference mode (4-6x speedup, ~75% token savings)
  --dataset-stats         Display MAGI Decision Dataset compilation statistics and DPO pair count
  --export-dataset <fmt>  Export fine-tuning dataset in sft, dpo, or sharegpt format
  --calibration           Display empirical confidence calibration scorecard (Brier Score & ECE)
  --contracts             Display active operational reversal contracts registry
  --memory                Display stored decision records and outcome tracking summary
  --reputation            Display agent epistemic reputation matrix and domain specializations
  --track-outcome <id>    Record actual outcome and compute outcome delta for a decision
  --actual "<text>"       Observed actual production outcome narrative
  --revert                Flag decision as reverted during outcome tracking
  --reason "<text>"       Reversal explanation reason
  --heartbeat             Execute autonomous contract heartbeat tick over pending decisions
  --simulate-alert <id>   Simulate incoming telemetry alert breach for a specific contract ID
  --metric <val>          Observed numerical metric value for simulated alert
  --investigate           Trigger V4 Investigation Engine to deconstruct problem into Knowns, Unknowns, and Evidence
  --output <file.json>    Write complete synthesis JSON result to specified file
  --lang <code>           Force specific language (e.g. pt, es, en, ja, de, fr)
  --api-key <key>         Explicit Gemini API key
  --help, -h              Show this help message

Examples:
  npx tsx src/cli/main.ts "Should we migrate to microservices?"
  npx tsx src/cli/main.ts --distilled "Should we migrate to microservices?"
  npx tsx src/cli/main.ts --dataset-stats
  npx tsx src/cli/main.ts --export-dataset dpo --output dpo_dataset.jsonl
  npx tsx src/cli/main.ts --memory
  npx tsx src/cli/main.ts --reputation
  npx tsx src/cli/main.ts --track-outcome HIST-021 --actual "Zero cache leak"
  npx tsx src/cli/main.ts --calibration
  npx tsx src/cli/main.ts --contracts
  npx tsx src/cli/main.ts --mock --json
  `);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  if (args.includes('--calibration')) {
    const report = globalCalibrationEngine.computeCalibrationReport();
    printHeader('CONFIDENCE CALIBRATION SCORECARD');
    console.log(`\n  Decisions Tracked:         ${report.totalDecisions} (Survived: ${report.survivedCount}, Reverted: ${report.revertedCount}, Pending: ${report.pendingCount})`);
    console.log(`  Brier Score:               ${report.brierScore.toFixed(4)} (0.0000 = perfect calibration)`);
    console.log(`  Expected Calibration Error:${report.expectedCalibrationError.toFixed(4)} (ECE)`);
    console.log(`  Overconfidence Bias:       ${report.overconfidenceBias >= 0 ? '+' : ''}${report.overconfidenceBias.toFixed(4)}\n`);
    console.log('  RELIABILITY BINS:');
    console.log('  Range       | Count | Mean Conf | Survival Rate | Error');
    console.log('  ------------+-------+-----------+---------------+-------');
    report.reliabilityBins.forEach(b => {
      const range = `[${b.binStart.toFixed(2)}-${b.binEnd.toFixed(2)}]`.padEnd(11);
      const count = String(b.sampleCount).padStart(5);
      const mConf = `${(b.meanConfidence * 100).toFixed(1)}%`.padStart(9);
      const sRate = `${(b.empiricalSurvivalRate * 100).toFixed(1)}%`.padStart(13);
      const err = `${(b.calibrationError * 100).toFixed(1)}%`.padStart(5);
      console.log(`  ${range} | ${count} | ${mConf} | ${sRate} | ${err}`);
    });
    console.log('\n' + '='.repeat(70) + '\n');
    return;
  }

  if (args.includes('--contracts')) {
    const contracts = globalReversalMonitor.getContracts();
    printHeader('OPERATIONAL REVERSAL CONTRACTS REGISTRY');
    console.log(`\n  Total Contracts Registered: ${contracts.length}\n`);
    console.log('  ID          | Metric                     | Operator | Threshold | Action       | Status');
    console.log('  ------------+----------------------------+----------+-----------+--------------+---------');
    contracts.forEach(c => {
      const id = c.id.padEnd(11);
      const metric = c.metric.padEnd(26);
      const op = c.operator.padStart(8);
      const thresh = String(c.threshold).padStart(9);
      const action = c.action.padEnd(12);
      const status = c.status === 'TRIPPED' ? '\x1b[31m[TRIPPED]\x1b[0m' : '\x1b[32m[ACTIVE]\x1b[0m ';
      console.log(`  ${id} | ${metric} | ${op} | ${thresh} | ${action} | ${status}`);
    });
    console.log('\n' + '='.repeat(70) + '\n');
    return;
  }

  if (args.includes('--memory') || args.includes('--decisions')) {
    const summary = globalDecisionMemory.getMemorySummary();
    const decisions = globalDecisionMemory.getAllDecisions();
    printHeader('DECISION MEMORY & OUTCOME TRACKER');
    console.log(`\n  Total Stored Decisions:    ${summary.totalDecisions} (Survived: ${summary.survivedCount}, Reverted: ${summary.revertedCount}, Pending: ${summary.pendingCount})`);
    console.log(`  Overall Survival Rate:     ${(summary.survivalRate * 100).toFixed(1)}%`);
    console.log(`  Average Stored Confidence: ${(summary.averageConfidence * 100).toFixed(1)}%`);
    console.log(`  Average Outcome Delta:     ${summary.averageDelta.toFixed(3)}\n`);
    console.log('  DECISION RECORDS:');
    console.log('  ID          | Domain         | Status     | Conf | Delta | Problem');
    console.log('  ------------+----------------+------------+------+-------+----------------------------------');
    decisions.forEach(d => {
      const id = d.decisionId.padEnd(11);
      const dom = d.domain.padEnd(14);
      const st = d.status === 'SURVIVED'
        ? '\x1b[32m[SURVIVED]\x1b[0m'
        : (d.status === 'REVERTED' ? '\x1b[31m[REVERTED]\x1b[0m' : '\x1b[33m[PENDING]\x1b[0m ');
      const conf = `${(d.declaredConfidence * 100).toFixed(0)}%`.padStart(4);
      const delta = d.outcomeDelta !== undefined ? d.outcomeDelta.toFixed(2).padStart(5) : '  N/A';
      const prob = d.problem.length > 34 ? d.problem.slice(0, 31) + '...' : d.problem;
      console.log(`  ${id} | ${dom} | ${st} | ${conf} | ${delta} | ${prob}`);
    });
    console.log('\n' + '='.repeat(70) + '\n');
    return;
  }

  if (args.includes('--reputation')) {
    const profiles = globalAgentReputationRegistry.getAllProfiles();
    printHeader('AGENT EPISTEMIC REPUTATION MATRIX');
    console.log('\n  Agent       | Base Score | Decisions | Survived | Reverted | Vindications | False Alarms');
    console.log('  ------------+------------+-----------+----------+----------+--------------+-------------');
    profiles.forEach(p => {
      const name = p.agentId.padEnd(11);
      const score = p.baseReputation.toFixed(2).padStart(10);
      const decs = String(p.totalDecisionsInvolved).padStart(9);
      const surv = String(p.survivedDecisions).padStart(8);
      const rev = String(p.revertedDecisions).padStart(8);
      const vind = String(p.minorityVindications).padStart(12);
      const fls = String(p.falseAlarms).padStart(12);
      console.log(`  ${name} | ${score} | ${decs} | ${surv} | ${rev} | ${vind} | ${fls}`);
    });
    console.log('\n  DOMAIN SPECIALIZATION & DELIBERATION WEIGHT MODIFIERS:');
    profiles.forEach(p => {
      console.log(`\n  ▶ ${p.agentId}:`);
      Object.values(p.domainReputations).forEach(dr => {
        const mod = globalAgentReputationRegistry.getDomainWeightModifier(p.agentId, dr.domain);
        const modStr = mod >= 0 ? `+${mod.toFixed(1)}` : mod.toFixed(1);
        console.log(`    • ${dr.domain.padEnd(15)}: Score ${dr.score.toFixed(2)} | Accuracy ${(dr.accuracyRate * 100).toFixed(0)}% | Weight Mod: ${modStr}`);
      });
    });
    console.log('\n' + '='.repeat(70) + '\n');
    return;
  }

  const trackIdx = args.indexOf('--track-outcome');
  if (trackIdx !== -1 && args[trackIdx + 1]) {
    const decisionId = args[trackIdx + 1];
    const actualIdx = args.indexOf('--actual');
    const actual = actualIdx !== -1 && args[actualIdx + 1] ? args[actualIdx + 1] : 'Manual telemetry update';
    const isRevert = args.includes('--revert');
    const reasonIdx = args.indexOf('--reason');
    const reason = reasonIdx !== -1 && args[reasonIdx + 1] ? args[reasonIdx + 1] : (isRevert ? 'Reverted via CLI command' : undefined);

    try {
      const result = globalDecisionMemory.trackDecisionOutcome({
        decisionId,
        actualOutcome: actual,
        status: isRevert ? 'REVERTED' : 'SURVIVED',
        reversalReason: reason,
      });

      printHeader(`OUTCOME TRACKING REPORT: ${decisionId}`);
      console.log(`\n  Status:             ${result.status === 'SURVIVED' ? '\x1b[32mSURVIVED\x1b[0m' : '\x1b[31mREVERTED\x1b[0m'}`);
      console.log(`  Outcome Delta:      ${result.deltaReport.rawDelta.toFixed(3)} (${result.deltaReport.matchClassification})`);
      console.log(`  Explanation:        ${result.deltaReport.explanation}`);
      if (result.failurePattern) {
        console.log(`  Failure Pattern:    \x1b[33m${result.failurePattern}\x1b[0m`);
      }
      if (result.postMortem) {
        console.log(`\n  POST-MORTEM AUTOPSY:`);
        console.log(`  Dissenting Agent:   ${result.postMortem.dissentingAgent}`);
        console.log(`  Minority Vindicated:${result.postMortem.minorityVindicated ? '\x1b[32mYES\x1b[0m' : 'NO'} (Score: ${result.postMortem.minorityVindicationScore})`);
        console.log(`  Root Cause:         ${result.postMortem.rootCauseAttribution}`);
        console.log(`  Majority Flaw:      ${result.postMortem.majorityFlaw}`);
        console.log(`  Reputation Deltas:  Melchior: ${result.postMortem.agentReputationDeltas.MELCHIOR > 0 ? '+' : ''}${result.postMortem.agentReputationDeltas.MELCHIOR.toFixed(2)}, Balthasar: ${result.postMortem.agentReputationDeltas.BALTHASAR > 0 ? '+' : ''}${result.postMortem.agentReputationDeltas.BALTHASAR.toFixed(2)}, Casper: ${result.postMortem.agentReputationDeltas.CASPER > 0 ? '+' : ''}${result.postMortem.agentReputationDeltas.CASPER.toFixed(2)}`);
      }
      console.log('\n' + '='.repeat(70) + '\n');
    } catch (err: any) {
      console.error(`\x1b[31mError tracking outcome:\x1b[0m ${err.message}`);
    }
    return;
  }

  if (args.includes('--dataset-stats')) {
    const stats = globalDatasetBuilder.getDatasetStats();
    printHeader('MAGI DECISION DATASET — COMPILATION STATISTICS');
    console.log(`\n  Total Training Entries:    ${stats.totalEntries}`);
    console.log(`  SFT Instruction Samples:   ${stats.sftSamples}`);
    console.log(`  DPO Preference Pairs:      ${stats.dpoPairs}`);
    console.log(`  ShareGPT Dialogue Samples: ${stats.shareGptSamples}`);
    console.log(`  Average Quality Score:     ${stats.averageQualityScore.toFixed(3)} (0.00 to 1.00)`);
    console.log(`  Average Outcome Delta:     ${stats.averageDelta.toFixed(3)}`);
    console.log(`  Estimated Dataset Tokens:  ~${stats.estimatedTokens.toLocaleString()}\n`);
    console.log('  DOMAIN DISTRIBUTION:');
    Object.entries(stats.domainDistribution).forEach(([dom, count]) => {
      console.log(`    • ${dom.padEnd(16)}: ${count} entries`);
    });
    console.log('\n' + '='.repeat(70) + '\n');
    return;
  }

  const exportIdx = args.indexOf('--export-dataset');
  if (exportIdx !== -1 && args[exportIdx + 1]) {
    const format = args[exportIdx + 1] as 'sft' | 'dpo' | 'sharegpt' | 'raw';
    const result = globalDatasetBuilder.export(format);

    const outIdx = args.indexOf('--output');
    if (outIdx !== -1 && args[outIdx + 1]) {
      await fs.writeFile(args[outIdx + 1], result.jsonlContent, 'utf-8');
      console.log(`\n\x1b[32m[SUCCESS] Dataset successfully exported to ${args[outIdx + 1]}\x1b[0m (${result.entryCount} entries in ${format.toUpperCase()} format)\n`);
    } else {
      printHeader(`MAGI DECISION DATASET EXPORT [${format.toUpperCase()}]`);
      console.log(result.jsonlContent);
      console.log('\n' + '='.repeat(70) + '\n');
    }
    return;
  }

  if (args.includes('--heartbeat')) {
    printHeader('ACTIVE CONTRACT HEARTBEAT CYCLE');
    const report = await globalContractHeartbeat.tick();
    console.log(`\n  Timestamp:                 ${report.timestamp}`);
    console.log(`  Pending Decisions Checked: ${report.pendingDecisionsEvaluated}`);
    console.log(`  Active Contracts Evaluated:${report.activeContractsEvaluated}`);
    console.log(`  Contracts Tripped:         ${report.contractsTripped}`);
    console.log(`  Decisions Reverted:        ${report.decisionsReverted.length > 0 ? report.decisionsReverted.join(', ') : 'None'}`);
    console.log(`  Decisions Survived:        ${report.decisionsSurvived.length > 0 ? report.decisionsSurvived.join(', ') : 'None'}`);
    if (report.errors.length > 0) {
      console.log(`  Errors:                    ${report.errors.join('; ')}`);
    }
    console.log('\n' + '='.repeat(70) + '\n');
    return;
  }

  if (args.includes('--local-status')) {
    printHeader('OLLAMA LOCAL DIVERSITY STATUS');
    const status = await checkOllamaHealth();
    console.log(`\n  Ollama Daemon:       ${status.available ? '\x1b[32m[ONLINE]\x1b[0m' : '\x1b[31m[OFFLINE]\x1b[0m'} (${status.host})`);
    console.log(`  Latency:             ${status.latencyMs}ms`);
    if (status.error) {
      console.log(`  Error:               \x1b[31m${status.error}\x1b[0m`);
    }
    console.log(`  Installed Models:    ${status.models.length}`);
    if (status.models.length > 0) {
      status.models.forEach(m => console.log(`    • ${m}`));
    } else {
      console.log('    (No models installed. Run `ollama pull <model>` to download)');
    }
    console.log('\n' + '='.repeat(70) + '\n');
    return;
  }

  if (args.includes('--storage-status')) {
    printHeader('MAGI JSON STORAGE REPOSITORY STATUS');
    const status = globalStorageManager.getStatus();
    console.log(`\n  Storage Directory:   ${status.storageDir}`);
    console.log(`  Active JSON Files:   ${status.fileCount}`);
    console.log(`  Total Data Size:     ${(status.totalSizeBytes / 1024).toFixed(2)} KB\n`);
    if (status.files.length > 0) {
      status.files.forEach(f => console.log(`    • ${f}`));
    } else {
      console.log('    (Storage directory initialized)');
    }
    console.log('\n' + '='.repeat(70) + '\n');
    return;
  }

  const backupIdx = args.indexOf('--backup-storage');
  if (backupIdx !== -1 && args[backupIdx + 1]) {
    const targetDir = args[backupIdx + 1];
    printHeader('MAGI STORAGE BACKUP (GOOGLE DRIVE / CLOUD SYNC)');
    const res = globalStorageManager.backupTo(targetDir);
    console.log(`\n  Destination:       ${res.destination}`);
    console.log(`  Files Backed Up:   ${res.filesCopied.length}`);
    res.filesCopied.forEach(f => console.log(`    • ${f}`));
    console.log(`\n  \x1b[32m[SUCCESS] Storage snapshot successfully synchronized.\x1b[0m`);
    console.log('\n' + '='.repeat(70) + '\n');
    return;
  }

  const simIdx = args.indexOf('--simulate-alert');
  if (simIdx !== -1 && args[simIdx + 1]) {
    const contractId = args[simIdx + 1];
    const metricIdx = args.indexOf('--metric');
    const metricVal = metricIdx !== -1 && args[metricIdx + 1] ? Number(args[metricIdx + 1]) : 99;

    printHeader('SIMULATING TELEMETRY WEBHOOK ALERT');
    const result = globalWebhookEngine.parseAndIngest({
      contractId,
      value: metricVal,
      status: 'FIRING',
      summary: `Simulated alert breach for contract ${contractId}`,
    });

    console.log(`\n  Alerts Ingested:   ${result.alertsProcessed}`);
    console.log(`  Format Detected:   ${result.formatDetected}`);
    console.log(`  Contracts Matched: ${result.matchedContractIds.join(', ') || 'None'}`);
    console.log(`  Decisions Tripped: ${result.trippedDecisions.join(', ') || 'None'}`);
    console.log(`  Summary:           ${result.rawSummary}`);
    console.log('\n' + '='.repeat(70) + '\n');
    return;
  }

  const isMock = args.includes('--mock');
  const isLocal = args.includes('--local');
  const isGroq = args.includes('--groq') || (!isMock && !isLocal && !process.env.GEMINI_API_KEY && !!process.env.GROQ_API_KEY);
  const isJsonOnly = args.includes('--json');

  // Extract --output <path>
  let outputPath: string | undefined;
  const outputIdx = args.indexOf('--output');
  if (outputIdx !== -1 && args[outputIdx + 1]) {
    outputPath = args[outputIdx + 1];
  }

  // Extract --lang <code>
  let languageOverride: string | undefined;
  const langIdx = args.indexOf('--lang');
  if (langIdx !== -1 && args[langIdx + 1]) {
    languageOverride = args[langIdx + 1];
  }

  // Extract --api-key <key>
  let apiKeyOverride: string | undefined;
  const apiKeyIdx = args.indexOf('--api-key');
  if (apiKeyIdx !== -1 && args[apiKeyIdx + 1]) {
    apiKeyOverride = args[apiKeyIdx + 1];
  }

  // Extract --local-preset <preset>
  let localPreset: LocalDiversityPresetName = 'BALANCED_8B';
  const presetIdx = args.indexOf('--local-preset');
  if (presetIdx !== -1 && args[presetIdx + 1]) {
    localPreset = args[presetIdx + 1] as LocalDiversityPresetName;
  }

  // Filter out flag tokens
  const nonFlagTokens: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const token = args[i];
    if (token === '--mock' || token === '--local' || token === '--groq' || token === '--local-status' || token === '--storage-status' || token === '--json' || token === '-h' || token === '--help' || token === '--calibration' || token === '--contracts' || token === '--investigate' || token === '--memory' || token === '--decisions' || token === '--reputation' || token === '--revert' || token === '--dataset-stats' || token === '--distilled' || token === '--heartbeat') {
      continue;
    }
    if (token === '--output' || token === '--lang' || token === '--api-key' || token === '--track-outcome' || token === '--actual' || token === '--reason' || token === '--export-dataset' || token === '--simulate-alert' || token === '--metric' || token === '--local-preset' || token === '--backup-storage') {
      i++; // Skip argument value
      continue;
    }
    nonFlagTokens.push(token);
  }

  let question = nonFlagTokens.join(' ').trim();

  if (args.includes('--distilled')) {
    const targetQ = question || 'Should we migrate our monolithic PostgreSQL database to MongoDB?';
    printHeader('MAGI NATIVE DISTILLED INFERENCE (SINGLE-PASS UNIFIED MODEL)');
    console.log(`\n  Target Query: "${targetQ}"\n`);
    const distillResult = await globalNativeModelAdapter.deliberate(targetQ, {
      language: languageOverride,
    });
    const s = distillResult.synthesis;
    console.log(`  VERDICT:     ${formatStance(s.finalDecision)}`);
    console.log(`  SYNTHESIS:   ${s.coreVerdict}`);
    console.log(`  CONFIDENCE:  ${(s.auditableDecision?.confidence ? s.auditableDecision.confidence * 100 : 85).toFixed(0)}%`);
    console.log(`  MINORITY:    ${s.minorityReport?.minorityConcern}`);
    console.log(`  REVERSAL:    ${s.minorityReport?.reversalConditions?.join('; ')}`);
    console.log(`\n  EFFICIENCY PROFILE:`);
    console.log(`  Single-Pass Latency:     ${distillResult.profile.singlePassDurationMs}ms (vs ~${distillResult.profile.multiAgentEstimatedDurationMs}ms multi-agent)`);
    console.log(`  Tokens Consumed:         ${distillResult.profile.singlePassTokensUsed} (vs ~${distillResult.profile.multiAgentEstimatedTokens} multi-agent)`);
    console.log(`  Token Reduction:         \x1b[32m${distillResult.profile.tokenSavingsPercent}%\x1b[0m`);
    console.log(`  Speedup Factor:          \x1b[32m${distillResult.profile.speedupFactor}x\x1b[0m`);
    if (distillResult.escalationRecommended) {
      console.log(`  \x1b[33m[ESCALATION WARNING]\x1b[0m ${distillResult.escalationReason}`);
    }
    console.log('\n' + '='.repeat(70) + '\n');
    return;
  }

  if (args.includes('--investigate')) {
    const targetQ = question || 'Should we migrate our monolithic PostgreSQL database to MongoDB?';
    printHeader('MAGI V4 COGNITIVE INVESTIGATION ENGINE');
    console.log(`\n  Target Query: "${targetQ}"\n`);
    const invResult = await globalInvestigationEngine.executeInvestigation(targetQ);
    console.log(invResult.dilemmaBrief);
    console.log(`\n  Deliberation Readiness: [${invResult.readinessForDeliberation}]`);
    console.log(`  Evidence Gathered:      ${invResult.evidenceGathered.length} items (${invResult.durationMs}ms)\n`);
    console.log('='.repeat(70) + '\n');
    return;
  }

  // Dynamic user query: If no question was passed via arguments and not running --json, prompt interactively
  if (!question) {
    if (isJsonOnly) {
      console.error(JSON.stringify({ error: 'No question provided. Pass question as argument when using --json.' }));
      process.exit(1);
    }

    console.log('\n\x1b[1m\x1b[36m' + `
  ███╗   ███╗ █████╗  ██████╗ ██╗
  ████╗ ████║██╔══██╗██╔════╝ ██║
  ██╔████╔██║███████║██║  ███╗██║
  ██║╚██╔╝██║██╔══██║██║   ██║██║
  ██║ ╚═╝ ██║██║  ██║╚██████╔╝██║
  ╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝
  SUPERCOMPUTER DELIBERATION SYSTEM — V4.5 PRODUCTION INTELLIGENCE
    ` + '\x1b[0m');

    const rl = readline.createInterface({ input, output });
    try {
      question = await rl.question('\x1b[1m\x1b[33mMAGI > Enter your question for deliberation:\x1b[0m ');
      question = question.trim();
    } finally {
      rl.close();
    }

    if (!question) {
      console.log('\x1b[31mNo question provided. Exiting.\x1b[0m');
      return;
    }
  }

  // Provider resolution
  let provider;
  if (isMock) {
    const mock = new MockLanguageModelProvider();
    mock.onGenerate(req => {
      if (req.schemaName === 'MagiSynthesisOutput') {
        return resolvedInRoundOneFixtures.synthesis;
      }
      const isRound1 = req.systemInstruction?.includes('DELIBERATION ROUND 1');
      if (req.systemInstruction?.includes('MELCHIOR-1')) {
        return isRound1 ? resolvedInRoundOneFixtures.round1.MELCHIOR : resolvedInRoundOneFixtures.round0.MELCHIOR;
      }
      if (req.systemInstruction?.includes('BALTHASAR-2')) {
        return isRound1 ? resolvedInRoundOneFixtures.round1.BALTHASAR : resolvedInRoundOneFixtures.round0.BALTHASAR;
      }
      if (req.systemInstruction?.includes('CASPER-3')) {
        return isRound1 ? resolvedInRoundOneFixtures.round1.CASPER : resolvedInRoundOneFixtures.round0.CASPER;
      }
      return undefined;
    });
    provider = mock;
  } else if (!isLocal && !isGroq) {
    const key = apiKeyOverride || process.env.GEMINI_API_KEY;
    if (!key) {
      console.error(`\n\x1b[31m[ERROR] Neither GEMINI_API_KEY nor GROQ_API_KEY is configured.\x1b[0m`);
      console.error(`Please set your API key in the environment or a .env file:`);
      console.error(`  1. Copy .env.example to .env: copy .env.example .env`);
      console.error(`  2. Add your Gemini or Groq API key`);
      console.error(`  Or run with Groq: npx tsx src/cli/main.ts --groq`);
      console.error(`  Or run local models: npx tsx src/cli/main.ts --local`);
      console.error(`  Or run hermetic mock mode: npx tsx src/cli/main.ts --mock\n`);
      process.exit(1);
    }
    provider = new GeminiProvider({ apiKey: key, defaultModel: DEFAULT_GEMINI_MODEL });
  }

  let localHealthModels: string[] | undefined;
  if (isLocal) {
    const health = await checkOllamaHealth();
    if (!health.available) {
      console.error(`\n\x1b[31m[ERROR] Ollama daemon is offline or unreachable at ${health.host}.\x1b[0m`);
      console.error(`Ensure Ollama is running ('ollama serve') before running with --local.\n`);
      process.exit(1);
    }
    if (health.models.length === 0) {
      console.error(`\n\x1b[31m[ERROR] No models are installed in Ollama.\x1b[0m`);
      console.error(`Install a model first using: 'ollama pull llama3.2:3b'\n`);
      process.exit(1);
    }
    localHealthModels = health.models;
  }

  if (!isJsonOnly) {
    if (nonFlagTokens.length > 0) {
      console.log('\n\x1b[1m\x1b[36m' + `
  ███╗   ███╗ █████╗  ██████╗ ██╗
  ████╗ ████║██╔══██╗██╔════╝ ██║
  ██╔████╔██║███████║██║  ███╗██║
  ██║╚██╔╝██║██╔══██║██║   ██║██║
  ██║ ╚═╝ ██║██║  ██║╚██████╔╝██║
  ╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝
  SUPERCOMPUTER DELIBERATION SYSTEM — V4.5 PRODUCTION INTELLIGENCE
      ` + '\x1b[0m');
    }
    console.log(`Query: "${question}"`);
    if (isMock) {
      console.log(`Provider: Hermetic Mock Provider (Fixtures)`);
    } else if (isLocal) {
      console.log(`Provider: Ollama Local Diversity Engine [Preset: ${localPreset}] (Zero-Cost Local Architecture)`);
    } else if (isGroq) {
      console.log(`Provider: Groq Production Core [${process.env.GROQ_MODEL || 'openai/gpt-oss-120b'}]`);
    } else {
      console.log(`Provider: Google ${DEFAULT_GEMINI_MODEL}`);
    }
  }

  const hooks = isJsonOnly ? {} : {
    onRoundStart: (round: number, title: string) => {
      printHeader(`Stage: ${title}`);
    },
    onAgentCompleted: (round: number, out: AgentStructuredOutput) => {
      printAgentOutput(round, out);
    },
    onDisagreementDetected: (round: number, report: DisagreementReport) => {
      console.log(`\n\x1b[33m[DISAGREEMENT DETECTED]\x1b[0m ${report.reason}`);
      console.log(`  Max confidence spread: ${report.metrics.maxConfidenceDelta}`);
    },
    onConsensusReached: (round: number, report: DisagreementReport) => {
      console.log(`\n\x1b[32m[CONSENSUS ACHIEVED]\x1b[0m ${report.reason}`);
    },
    onCoreSynthesisStart: () => {
      printHeader('MAGI Core: Final Deliberation & Synthesis');
    },
  };

  const magi = isLocal
    ? createLocalMagiSystem({
        preset: localPreset,
        hooks,
        installedModels: localHealthModels,
      })
    : (isGroq
        ? createGroqFreeTierMagiSystem(process.env.GROQ_API_KEY, { hooks })
        : createMagiSystem({
            provider: provider!,
            hooks,
            model: isMock ? 'mock-model' : DEFAULT_GEMINI_MODEL,
          }));

  const result: MagiSynthesisResult = await magi.run(question, { language: languageOverride });

  if (isJsonOnly) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printHeader('MAGI CORE VERDICT');
    if (result.finalDecision === 'EPISTEMIC_HALT') {
      console.log(`\n\x1b[41m\x1b[37m[EPISTEMIC_HALT]\x1b[0m \x1b[1m\x1b[31mCRITICAL IRREVERSIBILITY & DISSENT DETECTED — AUTONOMOUS CLEARANCE REFUSED\x1b[0m`);
    } else {
      console.log(`\n\x1b[1mDecision:\x1b[0m ${result.finalDecision}`);
    }
    console.log(`\x1b[1mVerdict:\x1b[0m \x1b[32m${result.coreVerdict}\x1b[0m`);
    console.log(`\x1b[1mDeliberation Rounds Elapsed:\x1b[0m ${result.deliberationRoundsCount}`);
    if (result.metadata) {
      console.log(`\x1b[1mLanguage:\x1b[0m ${result.metadata.language}`);
      console.log(`\x1b[1mExecution Duration:\x1b[0m ${result.metadata.durationMs} ms`);
    }

    console.log('\n\x1b[1mArgument Quality Scores (1-10):\x1b[0m');
    console.log(`  MELCHIOR-1:  ${result.argumentQualityScore.MELCHIOR}/10`);
    console.log(`  BALTHASAR-2: ${result.argumentQualityScore.BALTHASAR}/10`);
    console.log(`  CASPER-3:    ${result.argumentQualityScore.CASPER}/10`);

    if (result.decisionMetrics) {
      console.log('\n\x1b[1mDecision Risk Metrics:\x1b[0m');
      console.log(`  • Decision Confidence: ${(result.decisionMetrics.decisionConfidence * 100).toFixed(0)}%`);
      console.log(`  • Dissent Strength:    ${(result.decisionMetrics.dissentStrength * 100).toFixed(0)}%`);
      console.log(`  • Reversibility:       ${(result.decisionMetrics.reversibility * 100).toFixed(0)}%`);
      console.log(`  • Risk Severity:       ${(result.decisionMetrics.riskSeverity * 100).toFixed(0)}%`);
      console.log(`  • Evidence Quality:    ${result.decisionMetrics.evidenceQuality.toFixed(1)}/10`);
    }

    console.log('\n\x1b[1mDecisive Factors:\x1b[0m');
    result.decisiveFactors.forEach(factor => console.log(`  • ${factor}`));

    console.log('\n\x1b[1mSynthesis Summary:\x1b[0m');
    console.log(`  ${result.synthesisSummary}`);

    if (result.minorityReport) {
      console.log('\n\x1b[1m\x1b[33m[MINORITY REPORT]\x1b[0m');
      console.log(`  Dissenting Agent:     ${result.minorityReport.dissentingAgent || 'BALTHASAR'}`);
      console.log(`  Core Concern:         ${result.minorityReport.minorityConcern}`);
      if (result.minorityReport.supportingFactors?.length) {
        console.log(`  Supporting Arguments:`);
        result.minorityReport.supportingFactors.forEach(f => console.log(`    - ${f}`));
      }
      if (result.minorityReport.reversalConditions?.length) {
        console.log(`  Reversal Conditions (Pivot Triggers):`);
        result.minorityReport.reversalConditions.forEach((c, idx) => console.log(`    [R-${idx + 1}] ${c}`));
      }
      if (result.minorityReport.contracts?.length) {
        console.log(`\n  \x1b[1mOperational Reversal Contracts (Telemetry Monitoring):\x1b[0m`);
        result.minorityReport.contracts.forEach(c => {
          console.log(`    • [${c.id}] ${c.metric} ${c.operator} ${c.threshold} (Window: ${c.window}) -> ACTION: ${c.action}`);
        });
      }
    }

    if (result.dissentingOpinionsNoted.length > 0) {
      console.log('\n\x1b[1mDissenting Records Preserved:\x1b[0m');
      result.dissentingOpinionsNoted.forEach(note => console.log(`  [!] ${note}`));
    }
    console.log('\n' + '='.repeat(70) + '\n');
  }

  // Save to file if --output was specified
  if (outputPath) {
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2), 'utf-8');
    if (!isJsonOnly) {
      console.log(`\x1b[32m[SUCCESS] Full deliberation JSON written to:\x1b[0m ${outputPath}\n`);
    }
  }
}

main().catch(err => {
  console.error('\n\x1b[31mFATAL ERROR in MAGI System:\x1b[0m', err);
  process.exit(1);
});
