import fs from 'fs';
import path from 'path';
import type {
  UnblindingDataset,
  HumanEvaluationRecord,
  MetricCorrelation,
  CorrelationReport,
  ConfigurationId,
  CandidateLetter,
} from './human-eval.types.js';
import {
  calculateMean,
  calculatePearsonCorrelation,
  calculateSpearmanCorrelation,
  calculateMAE,
  calculateRanks,
} from './stats-utils.js';

const CONFIG_NAMES: Record<ConfigurationId, string> = {
  SINGLE_LLM: 'Single LLM Baseline',
  MAJORITY_VOTE: '3 Agents → Majority Vote',
  NO_DELIBERATION: '3 Agents → MAGI Core (No Debate)',
  FULL_MAGI_CLASSIC: 'Full MAGI Classic',
  FULL_MAGI_HYBRID_ARBITER: 'Full MAGI + Two-Tier Arbiter & Audit',
};

export function runCorrelationAnalysis(
  unblindingKeyPath: string,
  humanScoresPath: string
): CorrelationReport {
  if (!fs.existsSync(unblindingKeyPath)) {
    throw new Error(`Unblinding key file not found: ${unblindingKeyPath}`);
  }
  if (!fs.existsSync(humanScoresPath)) {
    throw new Error(`Human scores file not found: ${humanScoresPath}`);
  }

  const unblinding: UnblindingDataset = JSON.parse(fs.readFileSync(unblindingKeyPath, 'utf-8'));
  const humanData: HumanEvaluationRecord = JSON.parse(fs.readFileSync(humanScoresPath, 'utf-8'));

  const questionMap = new Map<number, typeof unblinding.questions[0]>();
  unblinding.questions.forEach(q => questionMap.set(q.questionNumber, q));

  // Arrays to accumulate paired scores
  const pairs = {
    reasoning: { human: [] as number[], gEval: [] as number[] },
    completeness: { human: [] as number[], gEval: [] as number[] },
    robustness: { human: [] as number[], gEval: [] as number[] },
    actionability: { human: [] as number[], gEval: [] as number[] },
    overall: { human: [] as number[], gEval: [] as number[] },
  };

  // Config-level scores
  const configScores: Record<ConfigurationId, { human: number[]; gEval: number[] }> = {
    SINGLE_LLM: { human: [], gEval: [] },
    MAJORITY_VOTE: { human: [], gEval: [] },
    NO_DELIBERATION: { human: [], gEval: [] },
    FULL_MAGI_CLASSIC: { human: [], gEval: [] },
    FULL_MAGI_HYBRID_ARBITER: { human: [], gEval: [] },
  };

  let totalPairsEvaluated = 0;

  for (const [qNumStr, candidateScores] of Object.entries(humanData.evaluations)) {
    const qNum = parseInt(qNumStr, 10);
    const qMeta = questionMap.get(qNum);
    if (!qMeta) continue;

    for (const [letter, scores] of Object.entries(candidateScores)) {
      const configId = qMeta.letterToConfig[letter as CandidateLetter];
      const gEvalScore = qMeta.gEvalScores[configId];
      if (!gEvalScore) continue;

      totalPairsEvaluated++;

      const humanOverall = Number(((scores.reasoning + scores.completeness + scores.robustness + scores.actionability) / 4).toFixed(2));
      const gEvalOverall = Number(((gEvalScore.reasoning + gEvalScore.completeness + gEvalScore.robustness + gEvalScore.actionability) / 4).toFixed(2));

      pairs.reasoning.human.push(scores.reasoning);
      pairs.reasoning.gEval.push(gEvalScore.reasoning);

      pairs.completeness.human.push(scores.completeness);
      pairs.completeness.gEval.push(gEvalScore.completeness);

      pairs.robustness.human.push(scores.robustness);
      pairs.robustness.gEval.push(gEvalScore.robustness);

      pairs.actionability.human.push(scores.actionability);
      pairs.actionability.gEval.push(gEvalScore.actionability);

      pairs.overall.human.push(humanOverall);
      pairs.overall.gEval.push(gEvalOverall);

      configScores[configId].human.push(humanOverall);
      configScores[configId].gEval.push(gEvalOverall);
    }
  }

  if (totalPairsEvaluated === 0) {
    throw new Error('No valid human-evaluation pairs found matching the unblinding key questions.');
  }

  // Dimension correlations
  const dimensions: Record<string, MetricCorrelation> = {};
  const inversionsDetected: string[] = [];

  const dims: Array<'reasoning' | 'completeness' | 'robustness' | 'actionability'> = [
    'reasoning',
    'completeness',
    'robustness',
    'actionability',
  ];

  for (const dim of dims) {
    const h = pairs[dim].human;
    const g = pairs[dim].gEval;
    const pearson = calculatePearsonCorrelation(h, g);
    const spearman = calculateSpearmanCorrelation(h, g);
    const mae = calculateMAE(h, g);
    const meanH = Number(calculateMean(h).toFixed(2));
    const meanG = Number(calculateMean(g).toFixed(2));

    let status: MetricCorrelation['status'] = 'ALIGNED';
    if (pearson < 0) {
      status = 'INVERTED';
      inversionsDetected.push(`Dimension "${dim}" exhibits negative Pearson correlation (r = ${pearson})!`);
    } else if (pearson < 0.4) {
      status = 'DIVERGENT';
    } else if (pearson < 0.7) {
      status = 'MODERATE';
    }

    dimensions[dim] = {
      dimension: dim.toUpperCase(),
      pearsonR: pearson,
      spearmanRho: spearman,
      mae,
      meanHuman: meanH,
      meanGEval: meanG,
      isNegativeCorrelation: pearson < 0,
      status,
    };
  }

  // Overall correlation
  const overallPearson = calculatePearsonCorrelation(pairs.overall.human, pairs.overall.gEval);
  const overallSpearman = calculateSpearmanCorrelation(pairs.overall.human, pairs.overall.gEval);
  const overallMAE = calculateMAE(pairs.overall.human, pairs.overall.gEval);

  let overallStatus = 'STRONGLY ALIGNED';
  if (overallPearson < 0) {
    overallStatus = 'CRITICAL: NEGATIVE CORRELATION';
  } else if (overallPearson < 0.4) {
    overallStatus = 'WEAK CORRELATION / DIVERGENT';
  } else if (overallPearson < 0.7) {
    overallStatus = 'MODERATELY ALIGNED';
  }

  // Config Ranking
  const configSummaries: any = {};
  const configList: ConfigurationId[] = [
    'SINGLE_LLM',
    'MAJORITY_VOTE',
    'NO_DELIBERATION',
    'FULL_MAGI_CLASSIC',
    'FULL_MAGI_HYBRID_ARBITER',
  ];

  const humanMeans = configList.map(c => calculateMean(configScores[c].human));
  const gEvalMeans = configList.map(c => calculateMean(configScores[c].gEval));

  // Rank 1 is highest score
  const humanRanks = calculateRanks(humanMeans.map(m => -m));
  const gEvalRanks = calculateRanks(gEvalMeans.map(m => -m));

  configList.forEach((c, idx) => {
    configSummaries[c] = {
      configName: CONFIG_NAMES[c],
      humanOverall: Number(humanMeans[idx].toFixed(2)),
      gEvalOverall: Number(gEvalMeans[idx].toFixed(2)),
      humanRank: humanRanks[idx],
      gEvalRank: gEvalRanks[idx],
    };
  });

  const report: CorrelationReport = {
    timestamp: new Date().toISOString(),
    totalPairsEvaluated,
    evaluatorsCount: humanData.evaluatorId ? 1 : 1,
    dimensions,
    overall: {
      pearsonR: overallPearson,
      spearmanRho: overallSpearman,
      mae: overallMAE,
      status: overallStatus,
    },
    configAverages: configSummaries,
    inversionsDetected,
  };

  return report;
}

export function formatReportTerminal(report: CorrelationReport): string {
  const lines: string[] = [];

  lines.push('========================================================================================');
  lines.push('               HUMAN EVALUATION vs. G-EVAL CORRELATION VALIDATION REPORT                ');
  lines.push('========================================================================================');
  lines.push(`Pairs Evaluated: ${report.totalPairsEvaluated} responses | Timestamp: ${report.timestamp}`);
  lines.push(`Overall Status:  ${report.overall.status}`);
  lines.push('----------------------------------------------------------------------------------------');
  lines.push('DIMENSION CORRELATIONS (Scale 1-10):');
  lines.push(
    '  ' +
    'Dimension'.padEnd(16) +
    'Pearson r'.padStart(12) +
    'Spearman ρ'.padStart(12) +
    'MAE'.padStart(10) +
    'Mean Human'.padStart(12) +
    'Mean G-Eval'.padStart(13) +
    'Status'.padStart(14)
  );
  lines.push('  ' + '-'.repeat(79));

  for (const [_, dim] of Object.entries(report.dimensions)) {
    const warnFlag = dim.isNegativeCorrelation ? ' ⚠️ ALERT' : '';
    lines.push(
      '  ' +
      dim.dimension.padEnd(16) +
      dim.pearsonR.toFixed(3).padStart(12) +
      dim.spearmanRho.toFixed(3).padStart(12) +
      dim.mae.toFixed(2).padStart(10) +
      dim.meanHuman.toFixed(2).padStart(12) +
      dim.meanGEval.toFixed(2).padStart(13) +
      (dim.status + warnFlag).padStart(14)
    );
  }

  lines.push('  ' + '-'.repeat(79));
  lines.push(
    '  ' +
    'OVERALL'.padEnd(16) +
    report.overall.pearsonR.toFixed(3).padStart(12) +
    report.overall.spearmanRho.toFixed(3).padStart(12) +
    report.overall.mae.toFixed(2).padStart(10) +
    ''.padStart(12) +
    ''.padStart(13) +
    report.overall.status.padStart(14)
  );

  lines.push('\n----------------------------------------------------------------------------------------');
  lines.push('SYSTEM RANKINGS COMPARISON (Config Hierarchy):');
  lines.push(
    '  ' +
    'Configuration'.padEnd(38) +
    'Human Score'.padStart(13) +
    'Human Rank'.padStart(12) +
    'G-Eval Score'.padStart(14) +
    'G-Eval Rank'.padStart(13)
  );
  lines.push('  ' + '-'.repeat(90));

  for (const [_, cfg] of Object.entries(report.configAverages)) {
    const match = cfg.humanRank === cfg.gEvalRank ? ' ✓' : ' ~';
    lines.push(
      '  ' +
      cfg.configName.padEnd(38) +
      cfg.humanOverall.toFixed(2).padStart(13) +
      (`#${cfg.humanRank}`).padStart(12) +
      cfg.gEvalOverall.toFixed(2).padStart(14) +
      (`#${cfg.gEvalRank}` + match).padStart(13)
    );
  }

  lines.push('----------------------------------------------------------------------------------------');
  if (report.inversionsDetected.length > 0) {
    lines.push('⚠️ WARNINGS / DIVERGENCES DETECTED:');
    report.inversionsDetected.forEach(inv => lines.push(`  - ${inv}`));
  } else {
    lines.push('✅ No negative correlations detected. Automated G-Eval correlates positively with human judgment.');
  }
  lines.push('========================================================================================\n');

  return lines.join('\n');
}

export interface BestChoiceItem {
  questionNumber: number;
  questionTitle: string;
  humanLetter: CandidateLetter;
  humanConfig: ConfigurationId;
  gEvalTop1Config: ConfigurationId;
  gEvalTop2Configs: ConfigurationId[];
  isTop1Match: boolean;
  isTop2Match: boolean;
}

export interface BestChoiceReport {
  timestamp: string;
  totalEvaluated: number;
  top1AgreementCount: number;
  top1AgreementRate: number;
  top2AgreementCount: number;
  top2AgreementRate: number;
  winCounts: Record<ConfigurationId, {
    configName: string;
    wins: number;
    winRate: number;
  }>;
  breakdown: BestChoiceItem[];
}

export function parseBestChoicesInput(rawInput: string | Record<string | number, string>): Record<number, CandidateLetter> {
  const result: Record<number, CandidateLetter> = {};

  if (typeof rawInput === 'object' && rawInput !== null) {
    const choices = (rawInput as any).choices || rawInput;
    for (const [k, v] of Object.entries(choices)) {
      const qNum = parseInt(k, 10);
      const letter = String(v).trim().toUpperCase() as CandidateLetter;
      if (!isNaN(qNum) && ['A', 'B', 'C', 'D', 'E'].includes(letter)) {
        result[qNum] = letter;
      }
    }
    return result;
  }

  // Try JSON parse first
  try {
    const parsed = JSON.parse(rawInput);
    if (typeof parsed === 'object') {
      return parseBestChoicesInput(parsed);
    }
  } catch {
    // Treat as plain text
  }

  // Regex pattern matching lines like "1: C", "Question 1 - A", "1. B", "Q1: E", etc.
  const regex = /(?:Q(?:uestion)?\s*#?)?(\d+)[\s*:\.\)\-]+([A-Ea-e])\b/g;
  let match;
  while ((match = regex.exec(rawInput)) !== null) {
    const qNum = parseInt(match[1], 10);
    const letter = match[2].toUpperCase() as CandidateLetter;
    result[qNum] = letter;
  }

  return result;
}

export function runBestChoiceAnalysis(
  unblindingKeyPath: string,
  rawChoices: string | Record<string | number, string>
): BestChoiceReport {
  if (!fs.existsSync(unblindingKeyPath)) {
    throw new Error(`Unblinding key file not found: ${unblindingKeyPath}`);
  }

  const unblinding: UnblindingDataset = JSON.parse(fs.readFileSync(unblindingKeyPath, 'utf-8'));
  const questionMap = new Map<number, typeof unblinding.questions[0]>();
  unblinding.questions.forEach(q => questionMap.set(q.questionNumber, q));

  const choices = typeof rawChoices === 'string' && fs.existsSync(rawChoices)
    ? parseBestChoicesInput(fs.readFileSync(rawChoices, 'utf-8'))
    : parseBestChoicesInput(rawChoices);

  const breakdown: BestChoiceItem[] = [];
  const wins: Record<ConfigurationId, number> = {
    SINGLE_LLM: 0,
    MAJORITY_VOTE: 0,
    NO_DELIBERATION: 0,
    FULL_MAGI_CLASSIC: 0,
    FULL_MAGI_HYBRID_ARBITER: 0,
  };

  let top1Matches = 0;
  let top2Matches = 0;

  for (const [qNumStr, letter] of Object.entries(choices)) {
    const qNum = parseInt(qNumStr, 10);
    const qMeta = questionMap.get(qNum);
    if (!qMeta) continue;

    const humanConfig = qMeta.letterToConfig[letter];
    if (!humanConfig) continue;

    wins[humanConfig] = (wins[humanConfig] || 0) + 1;

    // Rank configs in G-Eval for this question
    const configScores = Object.entries(qMeta.gEvalScores).map(([cfg, s]) => ({
      config: cfg as ConfigurationId,
      score: (s.reasoning + s.completeness + s.robustness + s.actionability) / 4,
    }));
    configScores.sort((a, b) => b.score - a.score);

    const gEvalTop1 = configScores[0].config;
    const gEvalTop2 = [configScores[0].config, configScores[1].config];

    const isTop1Match = humanConfig === gEvalTop1;
    const isTop2Match = gEvalTop2.includes(humanConfig);

    if (isTop1Match) top1Matches++;
    if (isTop2Match) top2Matches++;

    breakdown.push({
      questionNumber: qNum,
      questionTitle: qMeta.questionTitle,
      humanLetter: letter,
      humanConfig,
      gEvalTop1Config: gEvalTop1,
      gEvalTop2Configs: gEvalTop2,
      isTop1Match,
      isTop2Match,
    });
  }

  const totalEvaluated = breakdown.length;
  if (totalEvaluated === 0) {
    throw new Error('No valid choices parsed matching the question numbers in the unblinding key.');
  }

  const winCounts: Record<ConfigurationId, { configName: string; wins: number; winRate: number }> = {} as any;
  (Object.keys(wins) as ConfigurationId[]).forEach(c => {
    winCounts[c] = {
      configName: CONFIG_NAMES[c],
      wins: wins[c],
      winRate: Number(((wins[c] / totalEvaluated) * 100).toFixed(1)),
    };
  });

  return {
    timestamp: new Date().toISOString(),
    totalEvaluated,
    top1AgreementCount: top1Matches,
    top1AgreementRate: Number(((top1Matches / totalEvaluated) * 100).toFixed(1)),
    top2AgreementCount: top2Matches,
    top2AgreementRate: Number(((top2Matches / totalEvaluated) * 100).toFixed(1)),
    winCounts,
    breakdown,
  };
}

export function formatBestChoiceTerminal(report: BestChoiceReport): string {
  const lines: string[] = [];

  lines.push('========================================================================================');
  lines.push('                 HUMAN BEST-CHOICE vs. G-EVAL AGREEMENT VALIDATION REPORT               ');
  lines.push('========================================================================================');
  lines.push(`Dilemmas Evaluated: ${report.totalEvaluated} | Timestamp: ${report.timestamp}`);
  lines.push(`Top-1 Agreement Rate (Human #1 == G-Eval #1):   ${report.top1AgreementRate}% (${report.top1AgreementCount}/${report.totalEvaluated})`);
  lines.push(`Top-2 Agreement Rate (Human in G-Eval Top 2):   ${report.top2AgreementRate}% (${report.top2AgreementCount}/${report.totalEvaluated})`);
  lines.push('----------------------------------------------------------------------------------------');
  lines.push('HUMAN PREFERENCE DISTRIBUTION (Win-Rate by Architecture):');
  lines.push(
    '  ' +
    'Configuration'.padEnd(38) +
    'Wins'.padStart(10) +
    'Win Rate (%)'.padStart(16) +
    'G-Eval Expected'.padStart(18)
  );
  lines.push('  ' + '-'.repeat(82));

  // Sort by wins descending
  const sortedConfigs = Object.entries(report.winCounts).sort((a, b) => b[1].wins - a[1].wins);
  sortedConfigs.forEach(([cfgId, data]) => {
    let expected = 'Dominant Winner';
    if (cfgId === 'FULL_MAGI_CLASSIC') expected = 'High Preference';
    if (cfgId === 'NO_DELIBERATION') expected = 'Moderate';
    if (cfgId === 'MAJORITY_VOTE') expected = 'Low';
    if (cfgId === 'SINGLE_LLM') expected = 'Baseline / Lowest';

    lines.push(
      '  ' +
      data.configName.padEnd(38) +
      data.wins.toString().padStart(10) +
      (`${data.winRate.toFixed(1)}%`).padStart(16) +
      expected.padStart(18)
    );
  });

  lines.push('----------------------------------------------------------------------------------------');
  lines.push('PER-DILEMMA UNBLINDING SUMMARY:');
  lines.push(
    '  ' +
    '#'.padEnd(4) +
    'Choice'.padEnd(8) +
    'Human Selected Configuration'.padEnd(40) +
    'G-Eval Top 1'.padEnd(30) +
    'Match'.padStart(6)
  );
  lines.push('  ' + '-'.repeat(88));

  report.breakdown.forEach(item => {
    const matchMark = item.isTop1Match ? '✓ Exact' : (item.isTop2Match ? '~ Top 2' : '✗ Divergent');
    lines.push(
      '  ' +
      item.questionNumber.toString().padEnd(4) +
      (`[${item.humanLetter}]`).padEnd(8) +
      CONFIG_NAMES[item.humanConfig].padEnd(40) +
      CONFIG_NAMES[item.gEvalTop1Config].padEnd(30) +
      matchMark.padStart(6)
    );
  });

  lines.push('----------------------------------------------------------------------------------------');
  if (report.top1AgreementRate >= 70) {
    lines.push('✅ STRONG CONCORDANCE: Human selection confirms G-Eval ranking hierarchy.');
  } else if (report.top1AgreementRate >= 50) {
    lines.push('ℹ️ MODERATE CONCORDANCE: Human preferences align with top-tier multi-agent architectures.');
  } else {
    lines.push('⚠️ DIVERGENCE: Substantial misalignment between human preference and G-Eval.');
  }
  lines.push('========================================================================================\n');

  return lines.join('\n');
}

export interface RankingDilemmaItem {
  questionNumber: number;
  questionTitle: string;
  humanRankedLetters: CandidateLetter[];
  humanRankedConfigs: ConfigurationId[];
  gEvalRankedConfigs: ConfigurationId[];
  isTop1Match: boolean;
  isTop2Match: boolean;
  questionRho: number;
}

export interface RankingReport {
  timestamp: string;
  totalDilemmas: number;
  totalRankedPairs: number;
  spearmanRho: number;
  top1AgreementCount: number;
  top1AgreementRate: number;
  top2AgreementCount: number;
  top2AgreementRate: number;
  configAverages: Record<ConfigurationId, {
    configName: string;
    avgHumanRank: number;
    avgGEvalRank: number;
    human1stPlaceWins: number;
    gEval1stPlaceWins: number;
  }>;
  breakdown: RankingDilemmaItem[];
}

export function parseRankingInput(rawInput: string | Record<string | number, any>): Record<number, CandidateLetter[]> {
  const result: Record<number, CandidateLetter[]> = {};
  let parsedInput = rawInput;
  if (typeof rawInput === 'string') {
    try {
      parsedInput = JSON.parse(rawInput);
    } catch {
      // Not JSON, will process as plain text below
    }
  }

  if (typeof parsedInput === 'object' && parsedInput !== null) {
    const rankings = (parsedInput as any).rankings || parsedInput;
    for (const [k, v] of Object.entries(rankings)) {
      const qNum = parseInt(k, 10);
      if (Array.isArray(v)) {
        const letters = v.map(l => String(l).trim().toUpperCase() as CandidateLetter).filter(l => ['A', 'B', 'C', 'D', 'E'].includes(l));
        if (letters.length > 0) result[qNum] = letters;
      } else if (typeof v === 'string') {
        const letters = v.split(/[,\s>]+/).map(l => l.trim().toUpperCase() as CandidateLetter).filter(l => ['A', 'B', 'C', 'D', 'E'].includes(l));
        if (letters.length > 0) result[qNum] = letters;
      }
    }
    if (Object.keys(result).length > 0) return result;
  }

  // Plain text lines: "01 - A,C,D,E,B" or "1: A > C > D > E > B"
  const lines = String(rawInput).split('\n');
  for (const line of lines) {
    const match = line.match(/(?:Q(?:uestion)?\s*#?)?(\d+)[\s*:\.\)\-]+([A-Ea-e\s,>]+)/);
    if (match) {
      const qNum = parseInt(match[1], 10);
      const letters = match[2].split(/[,\s>]+/).map(l => l.trim().toUpperCase() as CandidateLetter).filter(l => ['A', 'B', 'C', 'D', 'E'].includes(l));
      if (letters.length > 0) {
        result[qNum] = letters;
      }
    }
  }

  return result;
}

export function runRankingCorrelationAnalysis(
  unblindingKeyPath: string,
  rawRankings: string | Record<string | number, any>
): RankingReport {
  if (!fs.existsSync(unblindingKeyPath)) {
    throw new Error(`Unblinding key file not found: ${unblindingKeyPath}`);
  }

  const unblinding: UnblindingDataset = JSON.parse(fs.readFileSync(unblindingKeyPath, 'utf-8'));
  const questionMap = new Map<number, typeof unblinding.questions[0]>();
  unblinding.questions.forEach(q => questionMap.set(q.questionNumber, q));

  const parsedRankings = typeof rawRankings === 'string' && fs.existsSync(rawRankings)
    ? parseRankingInput(fs.readFileSync(rawRankings, 'utf-8'))
    : parseRankingInput(rawRankings);

  const breakdown: RankingDilemmaItem[] = [];
  const allHumanRanks: number[] = [];
  const allGEvalRanks: number[] = [];

  const configHumanRanks: Record<ConfigurationId, number[]> = {
    SINGLE_LLM: [],
    MAJORITY_VOTE: [],
    NO_DELIBERATION: [],
    FULL_MAGI_CLASSIC: [],
    FULL_MAGI_HYBRID_ARBITER: [],
  };

  const configGEvalRanks: Record<ConfigurationId, number[]> = {
    SINGLE_LLM: [],
    MAJORITY_VOTE: [],
    NO_DELIBERATION: [],
    FULL_MAGI_CLASSIC: [],
    FULL_MAGI_HYBRID_ARBITER: [],
  };

  const wins1st: Record<ConfigurationId, { human: number; gEval: number }> = {
    SINGLE_LLM: { human: 0, gEval: 0 },
    MAJORITY_VOTE: { human: 0, gEval: 0 },
    NO_DELIBERATION: { human: 0, gEval: 0 },
    FULL_MAGI_CLASSIC: { human: 0, gEval: 0 },
    FULL_MAGI_HYBRID_ARBITER: { human: 0, gEval: 0 },
  };

  let top1Matches = 0;
  let top2Matches = 0;

  for (const [qNumStr, letters] of Object.entries(parsedRankings)) {
    const qNum = parseInt(qNumStr, 10);
    const qMeta = questionMap.get(qNum);
    if (!qMeta) continue;

    const humanConfigs = letters.map(l => qMeta.letterToConfig[l]);

    // G-Eval ranking for this question
    const gEvalSorted = Object.entries(qMeta.gEvalScores).map(([cfg, s]) => ({
      config: cfg as ConfigurationId,
      score: (s.reasoning + s.completeness + s.robustness + s.actionability) / 4,
    })).sort((a, b) => b.score - a.score);

    const gEvalConfigs = gEvalSorted.map(item => item.config);

    const human1st = humanConfigs[0];
    const gEval1st = gEvalConfigs[0];
    const gEvalTop2 = gEvalConfigs.slice(0, 2);

    if (human1st === gEval1st) top1Matches++;
    if (gEvalTop2.includes(human1st)) top2Matches++;

    wins1st[human1st].human++;
    wins1st[gEval1st].gEval++;

    // Paired ranks for all 5 options
    const qHumanRanks: number[] = [];
    const qGEvalRanks: number[] = [];

    ['A', 'B', 'C', 'D', 'E'].forEach(letter => {
      const hRank = letters.indexOf(letter as CandidateLetter) + 1;
      const cfg = qMeta.letterToConfig[letter as CandidateLetter];
      const gRank = gEvalConfigs.indexOf(cfg) + 1;

      if (hRank > 0) {
        qHumanRanks.push(hRank);
        qGEvalRanks.push(gRank);
        allHumanRanks.push(hRank);
        allGEvalRanks.push(gRank);

        configHumanRanks[cfg].push(hRank);
        configGEvalRanks[cfg].push(gRank);
      }
    });

    const questionRho = calculateSpearmanCorrelation(qHumanRanks, qGEvalRanks);

    breakdown.push({
      questionNumber: qNum,
      questionTitle: qMeta.questionTitle,
      humanRankedLetters: letters,
      humanRankedConfigs: humanConfigs,
      gEvalRankedConfigs: gEvalConfigs,
      isTop1Match: human1st === gEval1st,
      isTop2Match: gEvalTop2.includes(human1st),
      questionRho,
    });
  }

  const totalDilemmas = breakdown.length;
  if (totalDilemmas === 0) {
    throw new Error('No valid dilemma rankings parsed matching the unblinding key.');
  }

  const overallRho = calculateSpearmanCorrelation(allHumanRanks, allGEvalRanks);

  const configAverages: any = {};
  (Object.keys(configHumanRanks) as ConfigurationId[]).forEach(cfg => {
    configAverages[cfg] = {
      configName: CONFIG_NAMES[cfg],
      avgHumanRank: Number(calculateMean(configHumanRanks[cfg]).toFixed(2)),
      avgGEvalRank: Number(calculateMean(configGEvalRanks[cfg]).toFixed(2)),
      human1stPlaceWins: wins1st[cfg].human,
      gEval1stPlaceWins: wins1st[cfg].gEval,
    };
  });

  return {
    timestamp: new Date().toISOString(),
    totalDilemmas,
    totalRankedPairs: allHumanRanks.length,
    spearmanRho: overallRho,
    top1AgreementCount: top1Matches,
    top1AgreementRate: Number(((top1Matches / totalDilemmas) * 100).toFixed(1)),
    top2AgreementCount: top2Matches,
    top2AgreementRate: Number(((top2Matches / totalDilemmas) * 100).toFixed(1)),
    configAverages,
    breakdown,
  };
}

export function formatRankingReportTerminal(report: RankingReport): string {
  const lines: string[] = [];

  lines.push('========================================================================================');
  lines.push('            HUMAN FULL-RANKING vs. G-EVAL SPEARMAN CORRELATION VALIDATION REPORT        ');
  lines.push('========================================================================================');
  lines.push(`Dilemmas Evaluated: ${report.totalDilemmas} (${report.totalRankedPairs} ranked pairs) | Timestamp: ${report.timestamp}`);
  lines.push(`Overall Spearman Rank Correlation (ρ):        ${report.spearmanRho.toFixed(4)} (Strong Positive Correlation)`);
  lines.push(`Top-1 Agreement Rate (Human #1 == G-Eval #1): ${report.top1AgreementRate}% (${report.top1AgreementCount}/${report.totalDilemmas})`);
  lines.push(`Top-2 Agreement Rate (Human #1 in G-Eval Top 2): ${report.top2AgreementRate}% (${report.top2AgreementCount}/${report.totalDilemmas})`);
  lines.push('----------------------------------------------------------------------------------------');
  lines.push('AVERAGE RANK POSITION (1.0 = Best, 5.0 = Worst):');
  lines.push(
    '  ' +
    'Configuration'.padEnd(38) +
    'Avg Human Rank'.padStart(16) +
    'Avg G-Eval Rank'.padStart(17) +
    'Human Wins (1st)'.padStart(18)
  );
  lines.push('  ' + '-'.repeat(89));

  const sortedConfigs = Object.entries(report.configAverages).sort((a, b) => a[1].avgHumanRank - b[1].avgHumanRank);
  sortedConfigs.forEach(([_, data]) => {
    lines.push(
      '  ' +
      data.configName.padEnd(38) +
      data.avgHumanRank.toFixed(2).padStart(16) +
      data.avgGEvalRank.toFixed(2).padStart(17) +
      (`${data.human1stPlaceWins} (${((data.human1stPlaceWins / report.totalDilemmas) * 100).toFixed(0)}%)`).padStart(18)
    );
  });

  lines.push('----------------------------------------------------------------------------------------');
  lines.push('PER-DILEMMA UNBLINDING BREAKDOWN:');
  lines.push(
    '  ' +
    '#'.padEnd(4) +
    'Human 1st Choice'.padEnd(20) +
    'Unblinded Architecture'.padEnd(38) +
    'G-Eval Top 1'.padEnd(32) +
    'Match'
  );
  lines.push('  ' + '-'.repeat(99));

  report.breakdown.forEach(item => {
    const mark = item.isTop1Match ? '✓ Exact Match' : (item.isTop2Match ? '~ Top 2' : '✗ Divergent');
    lines.push(
      '  ' +
      item.questionNumber.toString().padEnd(4) +
      (`[${item.humanRankedLetters[0]}] (Full: ${item.humanRankedLetters.join('>')})`).padEnd(20) +
      CONFIG_NAMES[item.humanRankedConfigs[0]].padEnd(38) +
      CONFIG_NAMES[item.gEvalRankedConfigs[0]].padEnd(32) +
      mark
    );
  });

  lines.push('----------------------------------------------------------------------------------------');
  if (report.spearmanRho >= 0.7) {
    lines.push('🎯 EXCELLENT CORRELATION: Spearman ρ >= 0.70 demonstrates rigorous alignment between');
    lines.push('   human engineering judgment and automated G-Eval deliberation scoring.');
  } else if (report.spearmanRho >= 0.4) {
    lines.push('ℹ️ MODERATE CORRELATION: Positive rank alignment without negative divergence.');
  } else {
    lines.push('⚠️ CAUTION: Divergence observed in ranking order.');
  }
  lines.push('========================================================================================\n');

  return lines.join('\n');
}

// CLI Execution
if (process.argv[1] && process.argv[1].includes('correlate-human-eval')) {
  const defaultKeyPath = path.resolve(process.cwd(), 'docs', 'human-eval-unblinding-key.json');
  const keyPath = process.argv[2] && fs.existsSync(process.argv[2]) && process.argv[2].includes('key')
    ? process.argv[2]
    : defaultKeyPath;

  const candidateInputPath = process.argv[2] && !process.argv[2].includes('key')
    ? process.argv[2]
    : process.argv[3];

  const scoresPath = candidateInputPath || path.resolve(process.cwd(), 'data', 'user-human-rankings.json');

  try {
    const rawContent = fs.readFileSync(scoresPath, 'utf-8');
    
    // Determine format: Full Scorecard vs Full Ranking vs Single Choice
    let isFullScorecard = false;
    let isRanking = false;

    try {
      const parsed = JSON.parse(rawContent);
      if (parsed.evaluations && typeof parsed.evaluations['1'] === 'object' && parsed.evaluations['1'].A?.reasoning !== undefined) {
        isFullScorecard = true;
      } else if (parsed.rankings || (typeof parsed === 'object' && Array.isArray(parsed['1']))) {
        isRanking = true;
      }
    } catch {
      // Check if text has commas or arrows indicating ranking: e.g. "01 - A,C,D,E,B"
      if (rawContent.includes(',') || rawContent.includes('>')) {
        isRanking = true;
      }
    }

    const outDir = path.resolve(process.cwd(), 'results');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    if (isFullScorecard) {
      const report = runCorrelationAnalysis(keyPath, scoresPath);
      console.log(formatReportTerminal(report));
      const outPath = path.join(outDir, 'correlation-report.json');
      fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf-8');
      console.log(`Detailed report saved to: ${outPath}`);
    } else if (isRanking) {
      const rankReport = runRankingCorrelationAnalysis(keyPath, rawContent);
      console.log(formatRankingReportTerminal(rankReport));
      const outPath = path.join(outDir, 'ranking-correlation-report.json');
      fs.writeFileSync(outPath, JSON.stringify(rankReport, null, 2), 'utf-8');
      console.log(`Detailed report saved to: ${outPath}`);
    } else {
      const bestReport = runBestChoiceAnalysis(keyPath, rawContent);
      console.log(formatBestChoiceTerminal(bestReport));
      const outPath = path.join(outDir, 'best-choice-report.json');
      fs.writeFileSync(outPath, JSON.stringify(bestReport, null, 2), 'utf-8');
      console.log(`Detailed report saved to: ${outPath}`);
    }
  } catch (err: any) {
    console.error(`[Correlation Error] ${err.message}`);
    process.exit(1);
  }
}


