import type { ILanguageModelProvider } from '../providers/provider.interface.js';
import { DEFAULT_GEMINI_MODEL } from '../providers/gemini/gemini.config.js';
import type { SingleModelResponse } from '../comparison/comparison.types.js';
import type { MagiSynthesisResult } from '../domain/types.js';
import type { BenchmarkDilemma } from '../benchmark/benchmark.types.js';
import {
  PairwiseJudgeOutputSchema,
  type PairwiseJudgeOutput,
  type BlindedCandidate,
  type BlindedPairContext,
  type DimensionScores,
  type MultiJudgeEnsembleResult,
  type MultiJudgeEvaluationRun,
  type MultiJudgeDimensionStats,
  type MultiJudgeEnsembleScores,
} from './evaluation.types.js';

export interface LLMJudgeOptions {
  model?: string;
  temperature?: number;
}

export class LLMJudge {
  private provider: ILanguageModelProvider;
  private model: string;
  private temperature: number;

  constructor(provider: ILanguageModelProvider, options: LLMJudgeOptions = {}) {
    this.provider = provider;
    this.model = options.model || DEFAULT_GEMINI_MODEL;
    this.temperature = options.temperature ?? 0.1;
  }

  /**
   * Cleans text to remove identifying agent or system tokens to preserve blinding.
   */
  private sanitizeText(text: string): string {
    return text
      .replace(/\bMAGI\b/gi, 'Strategic Advisory System')
      .replace(/\bMelchior(-1)?\b/gi, 'Analytical Perspective')
      .replace(/\bBalthasar(-2)?\b/gi, 'Risk & Governance Perspective')
      .replace(/\bCasper(-3)?\b/gi, 'Pragmatic Engineering Perspective')
      .replace(/\bGemini\b/gi, 'Baseline Advisory')
      .trim();
  }

  public canonicalizeSingle(single: SingleModelResponse): Omit<BlindedCandidate, 'candidateId'> {
    return {
      executiveSummary: this.sanitizeText(single.summary),
      keyArguments: single.pros.map(p => this.sanitizeText(p)),
      identifiedRisks: single.cons.map(c => this.sanitizeText(c)),
      finalRecommendation: this.sanitizeText(single.verdict),
    };
  }

  public canonicalizeMagi(magi: MagiSynthesisResult): Omit<BlindedCandidate, 'candidateId'> {
    const keyArgs: string[] = [];

    // Collect initial arguments from agents without persona names
    if (magi.initialAnalysis) {
      if (magi.initialAnalysis.MELCHIOR?.keyArguments) {
        keyArgs.push(...magi.initialAnalysis.MELCHIOR.keyArguments.map(a => this.sanitizeText(a)));
      }
      if (magi.initialAnalysis.CASPER?.keyArguments) {
        keyArgs.push(...magi.initialAnalysis.CASPER.keyArguments.map(a => this.sanitizeText(a)));
      }
    }

    if (magi.decisiveFactors && magi.decisiveFactors.length > 0) {
      keyArgs.push(...magi.decisiveFactors.map((r: string) => `Key Factor: ${this.sanitizeText(r)}`));
    }

    const allRisks = [
      ...(magi.dissentingOpinionsNoted || []),
      ...(magi.initialAnalysis?.BALTHASAR?.identifiedRisks || []),
    ];

    return {
      executiveSummary: this.sanitizeText(magi.synthesisSummary),
      keyArguments: Array.from(new Set(keyArgs)).slice(0, 8),
      identifiedRisks: Array.from(new Set(allRisks.map(r => this.sanitizeText(r)))).slice(0, 6),
      finalRecommendation: this.sanitizeText(magi.coreVerdict),
    };
  }

  public createBlindedPair(
    dilemma: BenchmarkDilemma,
    single: SingleModelResponse,
    magi: MagiSynthesisResult,
    randomize = true
  ): BlindedPairContext {
    const canonSingle = this.canonicalizeSingle(single);
    const canonMagi = this.canonicalizeMagi(magi);

    // If randomize is true, flip coin for order
    const isSingleA = randomize ? Math.random() < 0.5 : true;

    const candidateA: BlindedCandidate = {
      candidateId: 'A',
      ...(isSingleA ? canonSingle : canonMagi),
    };

    const candidateB: BlindedCandidate = {
      candidateId: 'B',
      ...(isSingleA ? canonMagi : canonSingle),
    };

    return {
      dilemmaId: dilemma.id,
      category: dilemma.category,
      question: dilemma.question,
      keyTradeoffs: dilemma.keyTradeoffs,
      solutionA: candidateA,
      solutionB: candidateB,
      mapping: {
        A: isSingleA ? 'SINGLE' : 'MAGI',
        B: isSingleA ? 'MAGI' : 'SINGLE',
      },
    };
  }

  public async evaluatePairwise(context: BlindedPairContext): Promise<PairwiseJudgeOutput> {
    return this.evaluatePairwiseWithConfig(context, {
      model: this.model,
      temperature: this.temperature,
    });
  }

  public async evaluatePairwiseWithConfig(
    context: BlindedPairContext,
    config: { model?: string; temperature?: number }
  ): Promise<PairwiseJudgeOutput> {
    const systemInstruction = `You are a distinguished Principal Systems Architect acting as an impartial technical evaluator using the G-Eval methodology.
Evaluate two competing engineering solutions (Solution A and Solution B) proposed for an ambiguous technical dilemma.

EVALUATION RUBRICS (Score strictly from 1 to 10 for each dimension):
1. reasoningQuality (1-10):
   - 9-10: Flawless deductive and empirical logic, explicit tradeoff analysis, clear cause-and-effect modeling.
   - 5-8: Generally sound, but misses nuanced second-order implications or relies on generalities.
   - 1-4: Contains logical fallacies, superficial buzzwords, or contradictory statements.

2. completeness (1-10):
   - 9-10: Comprehensively addresses organizational, operational, architectural, and financial dimensions.
   - 5-8: Covers core technical aspects but overlooks key operational tradeoffs or team constraints.
   - 1-4: Shallow, leaves glaring architectural blind spots unaddressed.

3. robustness (1-10):
   - 9-10: Rigorously plans for catastrophic edge cases, partial failure modes, and zero-downtime rollback paths.
   - 5-8: Mentions standard risks but provides generic or hand-wavy mitigation strategies.
   - 1-4: Ignores critical failure modes; proposal would be hazardous in production.

4. actionability (1-10):
   - 9-10: Concrete, phased execution plan with unambiguous decision criteria and measurable milestones.
   - 5-8: Sensible direction, but lacks specific phasing or sequencing details.
   - 1-4: Abstract platitudes that cannot be executed by an engineering team.

CRITICAL ANTI-BIAS DIRECTIVES:
- DISREGARD VERBOSITY: A longer response is NOT inherently superior. Conciseness with high density of insight is rewarded.
- STRICT IMPARTIALITY: Evaluate each solution independently against the rubrics before determining the comparative winner.`;

    const prompt = `ENGINEERING DILEMMA:
Category: [${context.category}]
Question: "${context.question}"
${context.keyTradeoffs ? `Key Architectural Tradeoffs to consider:\n${context.keyTradeoffs.map(t => `• ${t}`).join('\n')}\n` : ''}
----------------------------------------------------------------------
SOLUTION A:
Executive Summary:
${context.solutionA.executiveSummary}

Key Arguments & Recommendations:
${context.solutionA.keyArguments.map(a => `- ${a}`).join('\n')}

Identified Risks & Constraints:
${context.solutionA.identifiedRisks.map(r => `- ${r}`).join('\n')}

Final Verdict:
${context.solutionA.finalRecommendation}
----------------------------------------------------------------------
SOLUTION B:
Executive Summary:
${context.solutionB.executiveSummary}

Key Arguments & Recommendations:
${context.solutionB.keyArguments.map(b => `- ${b}`).join('\n')}

Identified Risks & Constraints:
${context.solutionB.identifiedRisks.map(r => `- ${r}`).join('\n')}

Final Verdict:
${context.solutionB.finalRecommendation}
----------------------------------------------------------------------

<!-- EVAL_MAPPING: dilemmaId=${context.dilemmaId || ''} A=${context.mapping?.A || 'A'} B=${context.mapping?.B || 'B'} -->`;

    const response = await this.provider.generateStructured({
      model: config.model || this.model,
      systemInstruction,
      messages: [{ role: 'user', content: prompt }],
      schema: PairwiseJudgeOutputSchema,
      schemaName: 'PairwiseJudgeEvaluation',
      config: {
        temperature: config.temperature ?? this.temperature,
      },
    });

    return response.data;
  }

  /**
   * Evaluates a blinded candidate pair using a multi-judge ensemble (default N=3 independent evaluations).
   * Calculates sample mean and standard deviation for each rubric dimension,
   * measures inter-judge agreement, and determines the consensus winner.
   */
  public async evaluateWithMultiJudgeEnsemble(
    context: BlindedPairContext,
    judgeCount = 3,
    options?: {
      temperatures?: number[];
      models?: string[];
    }
  ): Promise<MultiJudgeEnsembleResult> {
    const n = Math.max(1, judgeCount);
    const defaultTemps = [0.0, 0.2, 0.4, 0.1, 0.3];
    const runs: MultiJudgeEvaluationRun[] = [];

    for (let i = 0; i < n; i++) {
      const temp = options?.temperatures?.[i] ?? defaultTemps[i % defaultTemps.length];
      const model = options?.models?.[i] ?? this.model;

      const output = await this.evaluatePairwiseWithConfig(context, { model, temperature: temp });
      runs.push({
        judgeIndex: i + 1,
        model,
        temperature: temp,
        output,
      });
    }

    const calcStats = (values: number[]): MultiJudgeDimensionStats => {
      const mean = Number((values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(2));
      if (values.length <= 1) {
        return { mean, stdDev: 0 };
      }
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
      const stdDev = Number(Math.sqrt(variance).toFixed(2));
      return { mean, stdDev };
    };

    const aReasoning = runs.map(r => r.output.candidateAScores.reasoningQuality);
    const aCompleteness = runs.map(r => r.output.candidateAScores.completeness);
    const aRobustness = runs.map(r => r.output.candidateAScores.robustness);
    const aActionability = runs.map(r => r.output.candidateAScores.actionability);
    const aComposite = runs.map(r =>
      (r.output.candidateAScores.reasoningQuality +
        r.output.candidateAScores.completeness +
        r.output.candidateAScores.robustness +
        r.output.candidateAScores.actionability) / 4
    );

    const bReasoning = runs.map(r => r.output.candidateBScores.reasoningQuality);
    const bCompleteness = runs.map(r => r.output.candidateBScores.completeness);
    const bRobustness = runs.map(r => r.output.candidateBScores.robustness);
    const bActionability = runs.map(r => r.output.candidateBScores.actionability);
    const bComposite = runs.map(r =>
      (r.output.candidateBScores.reasoningQuality +
        r.output.candidateBScores.completeness +
        r.output.candidateBScores.robustness +
        r.output.candidateBScores.actionability) / 4
    );

    const aStats: MultiJudgeEnsembleScores = {
      reasoningQuality: calcStats(aReasoning),
      completeness: calcStats(aCompleteness),
      robustness: calcStats(aRobustness),
      actionability: calcStats(aActionability),
      compositeOverall: calcStats(aComposite),
    };

    const bStats: MultiJudgeEnsembleScores = {
      reasoningQuality: calcStats(bReasoning),
      completeness: calcStats(bCompleteness),
      robustness: calcStats(bRobustness),
      actionability: calcStats(bActionability),
      compositeOverall: calcStats(bComposite),
    };

    const aMeanScores: DimensionScores = {
      reasoningQuality: aStats.reasoningQuality.mean,
      completeness: aStats.completeness.mean,
      robustness: aStats.robustness.mean,
      actionability: aStats.actionability.mean,
      rationale: runs.map(r => `Judge ${r.judgeIndex}: ${r.output.candidateAScores.rationale}`).join(' | '),
    };

    const bMeanScores: DimensionScores = {
      reasoningQuality: bStats.reasoningQuality.mean,
      completeness: bStats.completeness.mean,
      robustness: bStats.robustness.mean,
      actionability: bStats.actionability.mean,
      rationale: runs.map(r => `Judge ${r.judgeIndex}: ${r.output.candidateBScores.rationale}`).join(' | '),
    };

    const votes = { CANDIDATE_A: 0, CANDIDATE_B: 0, TIE: 0 };
    for (const r of runs) {
      votes[r.output.winner]++;
    }

    let consensusWinner: 'CANDIDATE_A' | 'CANDIDATE_B' | 'TIE' = 'TIE';
    if (votes.CANDIDATE_A > votes.CANDIDATE_B && votes.CANDIDATE_A > votes.TIE) {
      consensusWinner = 'CANDIDATE_A';
    } else if (votes.CANDIDATE_B > votes.CANDIDATE_A && votes.CANDIDATE_B > votes.TIE) {
      consensusWinner = 'CANDIDATE_B';
    }

    const interJudgeAgreement = Number((votes[consensusWinner] / runs.length).toFixed(2));

    const diff = Math.abs(bStats.compositeOverall.mean - aStats.compositeOverall.mean);
    let consensusMargin: 'SIGNIFICANT' | 'MODERATE' | 'SLIGHT' | 'NEGLIGIBLE' = 'NEGLIGIBLE';
    if (diff >= 1.0) consensusMargin = 'SIGNIFICANT';
    else if (diff >= 0.5) consensusMargin = 'MODERATE';
    else if (diff >= 0.2) consensusMargin = 'SLIGHT';

    const summaryAnalysis = `Multi-Judge Ensemble (${runs.length} evaluations, agreement: ${(interJudgeAgreement * 100).toFixed(0)}%): Consensus winner ${consensusWinner} with margin ${consensusMargin}. Candidate A Composite: ${aStats.compositeOverall.mean} (σ=${aStats.compositeOverall.stdDev}), Candidate B Composite: ${bStats.compositeOverall.mean} (σ=${bStats.compositeOverall.stdDev}).`;

    return {
      judgeCount: runs.length,
      runs,
      candidateA: {
        meanScores: aMeanScores,
        stats: aStats,
      },
      candidateB: {
        meanScores: bMeanScores,
        stats: bStats,
      },
      interJudgeAgreement,
      consensusWinner,
      consensusMargin,
      summaryAnalysis,
    };
  }

  /**
   * Evaluates a dilemma with position swapping (A vs B, and B vs A) to eliminate position bias.
   * Averages dimension scores across both runs and calculates definitive winner.
   */
  public async evaluateWithPositionSwap(
    dilemma: BenchmarkDilemma,
    single: SingleModelResponse,
    magi: MagiSynthesisResult
  ): Promise<{
    singleScores: DimensionScores;
    magiScores: DimensionScores;
    winner: 'MAGI' | 'SINGLE' | 'TIE';
    margin: string;
    comparativeAnalysis: string;
  }> {
    // Pass 1: Single is A, Magi is B
    const pair1 = this.createBlindedPair(dilemma, single, magi, false);
    const result1 = await this.evaluatePairwise(pair1);

    // Pass 2: Inverted positions (Magi is A, Single is B)
    const canonSingle = this.canonicalizeSingle(single);
    const canonMagi = this.canonicalizeMagi(magi);

    const pair2: BlindedPairContext = {
      dilemmaId: dilemma.id,
      category: dilemma.category,
      question: dilemma.question,
      keyTradeoffs: dilemma.keyTradeoffs,
      solutionA: { candidateId: 'A', ...canonMagi },
      solutionB: { candidateId: 'B', ...canonSingle },
      mapping: { A: 'MAGI', B: 'SINGLE' },
    };

    const result2 = await this.evaluatePairwise(pair2);

    // Map scores back to systems
    // In pass 1: A = Single, B = Magi
    // In pass 2: A = Magi, B = Single
    const singleScores: DimensionScores = {
      reasoningQuality: Number(((result1.candidateAScores.reasoningQuality + result2.candidateBScores.reasoningQuality) / 2).toFixed(1)),
      completeness: Number(((result1.candidateAScores.completeness + result2.candidateBScores.completeness) / 2).toFixed(1)),
      robustness: Number(((result1.candidateAScores.robustness + result2.candidateBScores.robustness) / 2).toFixed(1)),
      actionability: Number(((result1.candidateAScores.actionability + result2.candidateBScores.actionability) / 2).toFixed(1)),
      rationale: `Pass 1: ${result1.candidateAScores.rationale} | Pass 2: ${result2.candidateBScores.rationale}`,
    };

    const magiScores: DimensionScores = {
      reasoningQuality: Number(((result1.candidateBScores.reasoningQuality + result2.candidateAScores.reasoningQuality) / 2).toFixed(1)),
      completeness: Number(((result1.candidateBScores.completeness + result2.candidateAScores.completeness) / 2).toFixed(1)),
      robustness: Number(((result1.candidateBScores.robustness + result2.candidateAScores.robustness) / 2).toFixed(1)),
      actionability: Number(((result1.candidateBScores.actionability + result2.candidateAScores.actionability) / 2).toFixed(1)),
      rationale: `Pass 1: ${result1.candidateBScores.rationale} | Pass 2: ${result2.candidateAScores.rationale}`,
    };

    const singleTotal = singleScores.reasoningQuality + singleScores.completeness + singleScores.robustness + singleScores.actionability;
    const magiTotal = magiScores.reasoningQuality + magiScores.completeness + magiScores.robustness + magiScores.actionability;

    let winner: 'MAGI' | 'SINGLE' | 'TIE' = 'TIE';
    let margin = 'NEGLIGIBLE';

    const diff = magiTotal - singleTotal;
    if (diff > 1.5) {
      winner = 'MAGI';
      margin = diff > 4.0 ? 'SIGNIFICANT' : 'MODERATE';
    } else if (diff < -1.5) {
      winner = 'SINGLE';
      margin = Math.abs(diff) > 4.0 ? 'SIGNIFICANT' : 'MODERATE';
    } else if (diff > 0.5) {
      winner = 'MAGI';
      margin = 'SLIGHT';
    } else if (diff < -0.5) {
      winner = 'SINGLE';
      margin = 'SLIGHT';
    }

    return {
      singleScores,
      magiScores,
      winner,
      margin,
      comparativeAnalysis: `Position-Swapped Evaluation (Bias Neutralized):\n[Forward Pass]: ${result1.comparativeAnalysis}\n[Inverted Pass]: ${result2.comparativeAnalysis}`,
    };
  }

  public canonicalizeGeneric(candidate: {
    summary: string;
    keyArguments: string[];
    identifiedRisks: string[];
    finalRecommendation: string;
  }): Omit<BlindedCandidate, 'candidateId'> {
    return {
      executiveSummary: this.sanitizeText(candidate.summary),
      keyArguments: Array.from(new Set(candidate.keyArguments.map(a => this.sanitizeText(a)))).slice(0, 8),
      identifiedRisks: Array.from(new Set(candidate.identifiedRisks.map(r => this.sanitizeText(r)))).slice(0, 6),
      finalRecommendation: this.sanitizeText(candidate.finalRecommendation),
    };
  }

  public async evaluateArbitraryPair(
    dilemma: BenchmarkDilemma,
    candidateA: Omit<BlindedCandidate, 'candidateId'>,
    candidateB: Omit<BlindedCandidate, 'candidateId'>,
    labelA = 'A',
    labelB = 'B'
  ): Promise<{
    scoreA: DimensionScores;
    scoreB: DimensionScores;
    winner: string;
    margin: string;
    comparativeAnalysis: string;
  }> {
    const pairContext: BlindedPairContext = {
      dilemmaId: dilemma.id,
      category: dilemma.category,
      question: dilemma.question,
      keyTradeoffs: dilemma.keyTradeoffs,
      solutionA: { candidateId: 'A', ...candidateA },
      solutionB: { candidateId: 'B', ...candidateB },
      mapping: { A: labelA, B: labelB },
    };

    const result = await this.evaluatePairwise(pairContext);
    const winner =
      result.winner === 'CANDIDATE_A' ? labelA : result.winner === 'CANDIDATE_B' ? labelB : 'TIE';

    return {
      scoreA: result.candidateAScores,
      scoreB: result.candidateBScores,
      winner,
      margin: result.margin,
      comparativeAnalysis: result.comparativeAnalysis,
    };
  }
}
