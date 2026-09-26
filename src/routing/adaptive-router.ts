import { z } from 'zod';
import type { ILanguageModelProvider } from '../providers/provider.interface.js';
import type { MagiSynthesisResult, AgentStructuredOutput } from '../domain/types.js';
import { DeliberationEngine, type DeliberationRunOptions } from '../deliberation/deliberation-engine.js';
import { ObservabilityTracker, globalObservabilityTracker } from '../observability/observability-tracker.js';
import { SingleBaselineSchema } from '../comparison/comparison-engine.js';
import { calculateGeminiCost, DEFAULT_GEMINI_MODEL } from '../providers/gemini/gemini.config.js';

export const ComplexityClassificationSchema = z.object({
  complexity: z.enum(['LOW', 'MEDIUM', 'HIGH']).describe('Complexity tier of the question'),
  reason: z.string().describe('Detailed rationale for the assigned complexity tier'),
  primaryTradeoff: z.string().optional().describe('Core architectural or operational conflict if present'),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).describe('Potential blast radius of the decision'),
  recommendedRouting: z
    .enum(['FAST_PATH', 'STANDARD_TRIAD', 'DEEP_DELIBERATION'])
    .describe('Optimal execution path: FAST_PATH for simple/factual, STANDARD_TRIAD for moderate, DEEP_DELIBERATION for high risk/tradeoffs'),
  confidence: z.number().min(0).max(1).describe('Confidence in classification'),
});

export type ComplexityClassification = z.infer<typeof ComplexityClassificationSchema>;

export interface AdaptiveRoutingMetadata {
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendedRouting: 'FAST_PATH' | 'STANDARD_TRIAD' | 'DEEP_DELIBERATION';
  executionPathUsed: 'FAST_PATH' | 'STANDARD_TRIAD' | 'DEEP_DELIBERATION';
  classificationReason: string;
  tokensSaved: number;
  costSavedUsd: number;
  durationClassificationMs: number;
}

export interface AdaptiveRouterOptions {
  provider: ILanguageModelProvider;
  deliberationEngine: DeliberationEngine;
  tracker?: ObservabilityTracker;
  model?: string;
  enableFastHeuristics?: boolean;
}

export class AdaptiveRouter {
  private provider: ILanguageModelProvider;
  private deliberationEngine: DeliberationEngine;
  private tracker: ObservabilityTracker;
  private model: string;
  private enableFastHeuristics: boolean;

  constructor(options: AdaptiveRouterOptions) {
    this.provider = options.provider;
    this.deliberationEngine = options.deliberationEngine;
    this.tracker = options.tracker ?? globalObservabilityTracker;
    this.model = options.model || DEFAULT_GEMINI_MODEL;
    this.enableFastHeuristics = options.enableFastHeuristics ?? true;
  }

  /**
   * Fast rule-based heuristic to check if a query is obviously simple or obviously a high-stakes tradeoff.
   */
  private checkFastHeuristic(question: string): ComplexityClassification | null {
    if (!this.enableFastHeuristics) return null;

    const lower = question.toLowerCase().trim();
    const wordCount = lower.split(/\s+/).length;

    // Strong high-complexity indicators
    const highRiskKeywords = [
      'migrate', 'migration', 'rewrite', 'decouple', 'microservices',
      'monolith', 'split-brain', 'distributed transaction', 'consensus algorithm',
      'acid vs base', 'paxos', 'raft', 'gdpr compliance', 'existential risk',
      'rollback strategy', 'zero downtime', 'legacy moderniz'
    ];

    for (const kw of highRiskKeywords) {
      if (lower.includes(kw)) {
        return {
          complexity: 'HIGH',
          reason: `Detected critical architectural/risk pattern: "${kw}".`,
          riskLevel: 'HIGH',
          recommendedRouting: 'DEEP_DELIBERATION',
          confidence: 0.95,
        };
      }
    }

    // Obvious low-complexity indicators (simple definitions, factual queries, short queries without tradeoffs)
    const simplePrefixes = [
      'what is ', 'qual é ', 'o que é ', 'como funciona ', 'how does ',
      'definition of ', 'explica ', 'explain ', 'meaning of '
    ];
    const isSimplePrefix = simplePrefixes.some(p => lower.startsWith(p));
    const hasTradeoffKeywords = lower.includes(' or ') || lower.includes(' vs ') || lower.includes(' ou ') || lower.includes('should we');

    if (isSimplePrefix && !hasTradeoffKeywords && wordCount <= 14) {
      return {
        complexity: 'LOW',
        reason: 'Direct factual or conceptual explanation request with no architectural tradeoff.',
        riskLevel: 'LOW',
        recommendedRouting: 'FAST_PATH',
        confidence: 0.92,
      };
    }

    return null;
  }

  async classifyComplexity(question: string): Promise<ComplexityClassification> {
    const heuristic = this.checkFastHeuristic(question);
    if (heuristic) {
      return heuristic;
    }

    const systemInstruction =
      `You are the MAGI ADAPTIVE QUERY ROUTER.\n` +
      `Classify the submitted engineering or strategic question into a complexity tier:\n` +
      `- LOW (FAST_PATH): Factual explanation, simple lookup, uncontroversial standard best practices, zero architectural risk.\n` +
      `- MEDIUM (STANDARD_TRIAD): Standard engineering trade-offs, tool selections with manageable operational risk, or balanced design choices.\n` +
      `- HIGH (DEEP_DELIBERATION): Irreversible architectural changes, major organizational migrations, distributed consistency trade-offs, safety-critical or regulatory decisions.`;

    const userPrompt = `ANALYZE QUESTION COMPLEXITY:\n"${question}"`;

    try {
      const res = await this.provider.generateStructured({
        model: this.model,
        systemInstruction,
        messages: [{ role: 'user', content: userPrompt }],
        schema: ComplexityClassificationSchema,
        schemaName: 'ComplexityClassification',
        config: { temperature: 0.1 },
      });

      return res.data;
    } catch {
      // Fallback safe default
      return {
        complexity: 'MEDIUM',
        reason: 'Fallback to standard triad evaluation on classification error.',
        riskLevel: 'MEDIUM',
        recommendedRouting: 'STANDARD_TRIAD',
        confidence: 0.5,
      };
    }
  }

  async routeAndExecute(
    question: string,
    options: DeliberationRunOptions = {}
  ): Promise<MagiSynthesisResult & { routingMetadata: AdaptiveRoutingMetadata }> {
    const startTime = Date.now();
    const classification = await this.classifyComplexity(question);
    const durationClassificationMs = Date.now() - startTime;

    // PATH 1: FAST_PATH (LOW complexity)
    if (classification.recommendedRouting === 'FAST_PATH') {
      const fastStart = Date.now();
      const prompt = `You are an expert strategic engineering advisor. Provide a clear, objective analysis of:\n"${question}"\nOutput pros, cons, executive summary, and definitive verdict according to schema.`;
      
      const res = await this.provider.generateStructured({
        model: this.model,
        systemInstruction: 'You are an objective AI advisor providing clear and actionable technical guidance.',
        messages: [{ role: 'user', content: prompt }],
        schema: SingleBaselineSchema,
        schemaName: 'SingleBaselineEvaluation',
        config: { temperature: 0.2 },
      });

      const latencyMs = Date.now() - fastStart;
      const pt = res.usage?.promptTokens || 350;
      const ct = res.usage?.completionTokens || 250;
      const totalTokens = pt + ct;
      const cost = calculateGeminiCost(this.model, pt, ct);

      // Estimated savings compared to a full 3-agent 2-round Triad run (~3800 tokens, ~$0.009)
      const estimatedFullTokens = 3800;
      const estimatedFullCost = 0.009;
      const tokensSaved = Math.max(0, estimatedFullTokens - totalTokens);
      const costSavedUsd = Math.max(0, Number((estimatedFullCost - cost).toFixed(5)));

      const dummyOutput: AgentStructuredOutput = {
        agentId: 'MELCHIOR',
        stance: 'APPROVE',
        confidence: 0.9,
        summary: res.data.summary,
        keyArguments: res.data.pros,
        criticalAssumptions: [],
        identifiedRisks: res.data.cons,
        recommendedAction: res.data.verdict,
      };

      const synthesisResult: MagiSynthesisResult = {
        question,
        finalDecision: 'CONSENSUS_REACHED',
        coreVerdict: res.data.verdict,
        argumentQualityScore: { MELCHIOR: 8, BALTHASAR: 8, CASPER: 8 },
        decisiveFactors: res.data.pros,
        synthesisSummary: `[Fast-Path Adaptive Route]: ${res.data.summary}`,
        dissentingOpinionsNoted: res.data.cons,
        deliberationRoundsCount: 0,
        initialAnalysis: {
          MELCHIOR: { ...dummyOutput, agentId: 'MELCHIOR' },
          BALTHASAR: { ...dummyOutput, agentId: 'BALTHASAR' },
          CASPER: { ...dummyOutput, agentId: 'CASPER' },
        },
        rounds: [],
        totalTokensUsed: totalTokens,
        estimatedCostUsd: cost,
        metadata: {
          timestamp: new Date().toISOString(),
          durationMs: latencyMs,
          model: this.model,
          provider: this.provider.providerId,
          language: options.language || 'English',
          promptTokens: pt,
          completionTokens: ct,
          totalTokensUsed: totalTokens,
          estimatedCostUsd: cost,
        },
      };

      this.tracker.recordExecution(synthesisResult, 'FAST_PATH', { tokensSaved, costSavedUsd });

      return {
        ...synthesisResult,
        routingMetadata: {
          complexity: classification.complexity,
          recommendedRouting: classification.recommendedRouting,
          executionPathUsed: 'FAST_PATH',
          classificationReason: classification.reason,
          tokensSaved,
          costSavedUsd,
          durationClassificationMs,
        },
      };
    }

    // PATH 2 & 3: STANDARD_TRIAD or DEEP_DELIBERATION
    const executionPathUsed =
      classification.recommendedRouting === 'DEEP_DELIBERATION'
        ? 'DEEP_DELIBERATION'
        : 'STANDARD_TRIAD';

    const result = await this.deliberationEngine.run(question, options);
    this.tracker.recordExecution(result, executionPathUsed);

    return {
      ...result,
      routingMetadata: {
        complexity: classification.complexity,
        recommendedRouting: classification.recommendedRouting,
        executionPathUsed,
        classificationReason: classification.reason,
        tokensSaved: 0,
        costSavedUsd: 0,
        durationClassificationMs,
      },
    };
  }
}
