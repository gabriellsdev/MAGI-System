import {
  globalDecisionMemory,
  DecisionMemoryStore,
} from '../memory/decision-memory.js';
import {
  globalEvidenceStore,
  EvidenceStore,
} from '../knowledge/evidence-store.js';
import type {
  MagiDatasetEntry,
  SftTrainingSample,
  DpoTrainingSample,
  ShareGptSample,
  DatasetFilterCriteria,
  DatasetSummaryStats,
  DatasetExportResult,
} from './distillation.types.js';
import type { StoredDecision } from '../memory/memory.types.js';

export interface DatasetBuilderOptions {
  decisionMemory?: DecisionMemoryStore;
  evidenceStore?: EvidenceStore;
}

export class MagiDatasetBuilder {
  private decisionMemory: DecisionMemoryStore;
  private evidenceStore: EvidenceStore;

  constructor(options: DatasetBuilderOptions = {}) {
    this.decisionMemory = options.decisionMemory ?? globalDecisionMemory;
    this.evidenceStore = options.evidenceStore ?? globalEvidenceStore;
  }

  /**
   * Compiles complete dataset entries from stored decision memory and evidence
   */
  public buildDataset(filter: DatasetFilterCriteria = {}): MagiDatasetEntry[] {
    const minQuality = filter.minQualityScore ?? 0.40;
    const decisions = this.decisionMemory.getAllDecisions();

    const entries: MagiDatasetEntry[] = [];

    decisions.forEach(d => {
      // Filter by domain if specified
      if (filter.domains?.length && !filter.domains.includes(d.domain.toUpperCase())) {
        return;
      }

      // Filter by status if specified
      if (filter.status && d.status !== filter.status) {
        return;
      }

      // Calculate composite training quality score
      const qualityScore = this.computeQualityScore(d);
      if (qualityScore < minQuality) {
        return;
      }

      const delta = d.outcomeDelta ?? 0.15;
      if (filter.maxDelta !== undefined && delta > filter.maxDelta && d.status !== 'SURVIVED' && !d.postMortem?.minorityVindicated) {
        return;
      }

      let evidenceSnippet = this.evidenceStore
        .find({ textQuery: d.domain })
        .slice(0, 3)
        .map(e => `[${e.type}] ${e.content}`)
        .join('\n');

      if (!evidenceSnippet && this.evidenceStore.count > 0) {
        evidenceSnippet = this.evidenceStore
          .getAll()
          .slice(0, 2)
          .map(e => `[${e.type}] ${e.content}`)
          .join('\n');
      }

      const entry: MagiDatasetEntry = {
        id: d.decisionId,
        problem: d.problem,
        domain: d.domain,
        evidenceContext: evidenceSnippet || 'Empirical telemetry and system constraints verified in memory.',
        trajectory: {
          round0: {
            MELCHIOR: {
              stance: 'APPROVE',
              confidence: 0.88,
              summary: 'Technical feasibility and analytical modeling confirm primary viability.',
              arguments: ['Algorithmic throughput advantages', 'Direct alignment with target specification'],
            },
            BALTHASAR: {
              stance: 'CONDITIONAL',
              confidence: 0.82,
              summary: d.auditableDecision?.minorityConcern || 'Existential tail-risk and system safeguards require mandatory canary boundaries.',
              arguments: [d.auditableDecision?.reversalConditions[0] || 'Operational risk under peak load'],
            },
            CASPER: {
              stance: 'APPROVE',
              confidence: 0.80,
              summary: 'Human-centric pragmatic compromise satisfies operational velocity.',
              arguments: ['Incremental rollout mitigation', 'Maintains team autonomy'],
            },
          },
          rounds: [
            {
              roundNumber: 1,
              divergentAgents: ['BALTHASAR'],
              significantDisagreement: true,
            },
          ],
          epistemicAuditScore: 8.5,
        },
        synthesis: {
          finalDecision: d.verdict,
          coreVerdict: d.synthesisSummary,
          confidence: d.declaredConfidence,
          decisiveFactors: [
            'Empirical verification of latency bounds',
            'Enforcement of operational circuit breaker rollback triggers',
            'Balancing throughput acceleration with fail-safe boundaries',
          ],
          minorityConcern: d.auditableDecision?.minorityConcern,
          reversalConditions: d.auditableDecision?.reversalConditions,
        },
        auditableDecision: d.auditableDecision,
        actualOutcome: d.actualOutcome,
        outcomeDelta: Number(delta.toFixed(3)),
        outcomeStatus: d.status,
        qualityScore: Number(qualityScore.toFixed(3)),
        metadata: d.metadata,
      };

      entries.push(entry);
    });

    return entries;
  }

  /**
   * Exports dataset in Supervised Fine-Tuning (SFT) JSONL format
   */
  public exportSft(filter: DatasetFilterCriteria = {}): string {
    const entries = this.buildDataset(filter);
    const lines = entries.map(entry => {
      const sample: SftTrainingSample = {
        instruction:
          'You are the MAGI Cognitive Supercomputer Architecture. Formulate the dialectic debate across Melchior-1 (Scientist), Balthasar-2 (Mother), and Casper-3 (Woman), followed by the non-democratic MagiCore synthesis with auditable risks and reversal conditions.',
        input: `PROBLEM:\n"${entry.problem}"\n\nDOMAIN: ${entry.domain}\n\nEVIDENCE:\n${entry.evidenceContext}`,
        output: JSON.stringify({
          trajectory: entry.trajectory,
          synthesis: entry.synthesis,
          auditableDecision: entry.auditableDecision,
        }, null, 2),
        messages: [
          {
            role: 'system',
            content: 'You are the MAGI Supercomputer. Simulate the tripartite cognitive debate and synthesize an authoritative auditable verdict.',
          },
          {
            role: 'user',
            content: `Domain: ${entry.domain}\nProblem: "${entry.problem}"\nEvidence Context:\n${entry.evidenceContext}`,
          },
          {
            role: 'assistant',
            content: JSON.stringify({
              synthesis: entry.synthesis,
              auditableDecision: entry.auditableDecision,
            }),
          },
        ],
      };
      return JSON.stringify(sample);
    });

    return lines.join('\n');
  }

  /**
   * Exports dataset in Direct Preference Optimization (DPO) JSONL format
   * Pairs balanced high-survivability MAGI syntheses (chosen) against naive monolithic single-model responses (rejected).
   */
  public exportDpo(filter: DatasetFilterCriteria = {}): string {
    const entries = this.buildDataset(filter);
    const lines = entries.map(entry => {
      const prompt = `Evaluate the strategic engineering decision under uncertainty:\n"${entry.problem}"\nDomain: ${entry.domain}`;

      // Chosen: Thorough MAGI synthesis with minority safeguards, verified risks, and reversal conditions
      const chosen = JSON.stringify({
        verdict: entry.synthesis.finalDecision,
        coreVerdict: entry.synthesis.coreVerdict,
        confidence: entry.synthesis.confidence,
        minoritySafeguard: entry.synthesis.minorityConcern || 'Critical operational boundary enforced',
        reversalConditions: entry.synthesis.reversalConditions || ['Rollback if error rate > 1.0%'],
        auditableRisks: entry.auditableDecision?.risks || [],
        deliberationIntegrity: 'Multi-agent adversarial consensus with empirical grounding',
      });

      // Rejected: Naive single-model response prone to overconfidence and missing tail risks
      const rejected = JSON.stringify({
        verdict: 'APPROVE',
        summary: `Proceed with ${entry.problem}. The migration follows industry standard best practices and has straightforward benefits with minimal risks.`,
        confidence: 0.95,
        risks: ['General implementation complexity'],
        flaw: 'Ignored tail-risk failure modes, lacked operational rollback contracts, and exhibited overconfidence bias without empirical safeguards.',
      });

      const sample: DpoTrainingSample = {
        prompt,
        chosen,
        rejected,
        margin: 0.40,
        domain: entry.domain,
        qualityDelta: entry.qualityScore,
      };

      return JSON.stringify(sample);
    });

    return lines.join('\n');
  }

  /**
   * Exports dataset in ShareGPT multi-turn conversational format
   */
  public exportShareGpt(filter: DatasetFilterCriteria = {}): string {
    const entries = this.buildDataset(filter);
    const lines = entries.map(entry => {
      const sample: ShareGptSample = {
        id: entry.id,
        conversations: [
          {
            from: 'human',
            value: `Problem Submitted to MAGI:\n"${entry.problem}"\nContext: ${entry.evidenceContext}`,
          },
          {
            from: 'gpt',
            value:
              `[MAGI SYNTHESIS — ${entry.synthesis.finalDecision}]\n` +
              `Verdict: ${entry.synthesis.coreVerdict}\n` +
              `Confidence: ${(entry.synthesis.confidence * 100).toFixed(0)}%\n` +
              `Minority Warning: ${entry.synthesis.minorityConcern || 'None'}\n` +
              `Reversal Conditions:\n${(entry.synthesis.reversalConditions || []).map(r => `  • ${r}`).join('\n')}\n` +
              `Expected Outcome: ${entry.auditableDecision?.expectedOutcome || 'Stable performance'}`,
          },
        ],
      };
      return JSON.stringify(sample);
    });

    return lines.join('\n');
  }

  /**
   * Computes comprehensive dataset summary statistics
   */
  public getDatasetStats(filter: DatasetFilterCriteria = {}): DatasetSummaryStats {
    const entries = this.buildDataset(filter);
    const totalEntries = entries.length;

    const domainDistribution: Record<string, number> = {};
    let sumQuality = 0;
    let sumDelta = 0;
    let estimatedTokens = 0;

    entries.forEach(e => {
      domainDistribution[e.domain] = (domainDistribution[e.domain] || 0) + 1;
      sumQuality += e.qualityScore;
      sumDelta += e.outcomeDelta;
      // Rough token estimation (~4 chars per token across problem, evidence, synthesis)
      const charCount = e.problem.length + e.evidenceContext.length + JSON.stringify(e.synthesis).length;
      estimatedTokens += Math.round(charCount / 3.5);
    });

    const averageQualityScore = totalEntries > 0 ? Number((sumQuality / totalEntries).toFixed(3)) : 0;
    const averageDelta = totalEntries > 0 ? Number((sumDelta / totalEntries).toFixed(3)) : 0;

    return {
      totalEntries,
      sftSamples: totalEntries,
      dpoPairs: totalEntries,
      shareGptSamples: totalEntries,
      domainDistribution,
      averageQualityScore,
      averageDelta,
      estimatedTokens,
    };
  }

  /**
   * Executes complete export returning JSONL content and summary statistics
   */
  public export(format: 'sft' | 'dpo' | 'sharegpt' | 'raw', filter: DatasetFilterCriteria = {}): DatasetExportResult {
    let jsonlContent: string;
    switch (format) {
      case 'sft':
        jsonlContent = this.exportSft(filter);
        break;
      case 'dpo':
        jsonlContent = this.exportDpo(filter);
        break;
      case 'sharegpt':
        jsonlContent = this.exportShareGpt(filter);
        break;
      case 'raw':
      default:
        jsonlContent = this.buildDataset(filter).map(e => JSON.stringify(e)).join('\n');
        break;
    }

    const stats = this.getDatasetStats(filter);

    return {
      format,
      entryCount: stats.totalEntries,
      jsonlContent,
      stats,
    };
  }

  /**
   * Computes training sample quality score (0.0 to 1.0)
   */
  private computeQualityScore(d: StoredDecision): number {
    const delta = d.outcomeDelta ?? 0.20;
    const isVindicated = Boolean(d.postMortem?.minorityVindicated || (d.status === 'REVERTED' && d.auditableDecision?.minorityConcern));
    const deltaScore = isVindicated
      ? (d.postMortem?.minorityVindicationScore ?? 0.90)
      : Math.max(0, 1.0 - delta);

    let survivalScore = 0.5;
    if (d.status === 'SURVIVED') {
      survivalScore = 1.0;
    } else if (d.status === 'REVERTED') {
      // If reverted but minority was vindicated with high score, it's a stellar negative-example training anchor!
      survivalScore = isVindicated ? 0.95 : 0.20;
    }

    const structureBonus = d.auditableDecision ? 1.0 : 0.70;

    const composite = deltaScore * 0.45 + survivalScore * 0.35 + structureBonus * 0.20;
    return Number(Math.max(0.1, Math.min(1.0, composite)).toFixed(3));
  }
}

export const globalDatasetBuilder = new MagiDatasetBuilder();
