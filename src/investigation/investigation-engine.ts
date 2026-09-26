import type {
  InvestigationPlan,
  InvestigationResult,
  KnownFact,
  UnknownVariable,
  NeededEvidenceRequest,
  InvestigationHypothesis,
} from './investigation.types.js';
import type { Evidence } from '../knowledge/knowledge.types.js';
import { EvidenceStore, globalEvidenceStore } from '../knowledge/evidence-store.js';
import { ToolRegistry, globalToolRegistry } from '../tools/tool-registry.js';

export interface InvestigationEngineOptions {
  evidenceStore?: EvidenceStore;
  toolRegistry?: ToolRegistry;
}

export class InvestigationEngine {
  private evidenceStore: EvidenceStore;
  private toolRegistry: ToolRegistry;

  constructor(options: InvestigationEngineOptions = {}) {
    this.evidenceStore = options.evidenceStore ?? globalEvidenceStore;
    this.toolRegistry = options.toolRegistry ?? globalToolRegistry;
  }

  /**
   * Formulates an investigation plan by decomposing the problem into
   * what is already known, what is missing, and what evidence must be gathered.
   */
  public async createPlan(problem: string): Promise<InvestigationPlan> {
    const planId = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const pLower = problem.toLowerCase();

    const knowns: KnownFact[] = [];
    const unknowns: UnknownVariable[] = [];
    const neededEvidence: NeededEvidenceRequest[] = [];
    const hypotheses: InvestigationHypothesis[] = [];

    // Check existing evidence in Knowledge Layer
    const existingEvidence = this.evidenceStore.getAll();
    existingEvidence.forEach(ev => {
      ev.claims.forEach(cl => {
        knowns.push({
          statement: cl.statement,
          evidenceId: ev.id,
          confidence: cl.confidence,
          source: ev.source,
        });
      });
    });

    // Domain decomposition heuristics
    if (pLower.includes('postgres') || pLower.includes('mongo') || pLower.includes('database') || pLower.includes('banco')) {
      if (knowns.length === 0) {
        knowns.push({
          statement: 'Target workload involves relational or document database architectures.',
          confidence: 0.95,
          source: 'PROBLEM_STATEMENT',
        });
      }

      unknowns.push(
        { question: 'What is the current database volume, table sizes, and row cardinality?', criticality: 'HIGH' },
        { question: 'What is the read/write query ratio and access pattern profile?', criticality: 'HIGH' },
        { question: 'Does the application require cross-entity multi-record ACID transactions?', criticality: 'BLOCKING' },
        { question: 'What is the acceptable migration maintenance downtime window?', criticality: 'MEDIUM' }
      );

      neededEvidence.push(
        {
          id: `${planId}-req1`,
          targetTool: 'database_query',
          actionDescription: 'Inspect database table sizing and telemetry',
          parameters: { query: 'SELECT table_size, index_usage FROM pg_stat_user_tables;' },
          priority: 'IMMEDIATE',
          expectedInsight: 'Quantify storage footprint and table volume to determine migration risk.',
        },
        {
          id: `${planId}-req2`,
          targetTool: 'web_search',
          actionDescription: 'Search official consistency and migration specifications',
          parameters: { query: 'PostgreSQL vs MongoDB ACID guarantees and migration latency' },
          priority: 'IMMEDIATE',
          expectedInsight: 'Validate transactional semantics and known operational failure modes.',
        }
      );

      hypotheses.push(
        {
          id: 'H1',
          proposition: 'MongoDB document model accelerates rapid schema changes for polymorphic payloads.',
          expectedEvidenceType: 'WEB',
          status: 'UNTESTED',
        },
        {
          id: 'H2',
          proposition: 'PostgreSQL relational integrity avoids complex application-level consensus logic.',
          expectedEvidenceType: 'DATABASE',
          status: 'UNTESTED',
        }
      );
    } else if (pLower.includes('k8s') || pLower.includes('kubernetes') || pLower.includes('microservice') || pLower.includes('monolith')) {
      knowns.push({
        statement: 'System evaluation involves distributed infrastructure deployment.',
        confidence: 0.90,
        source: 'PROBLEM_STATEMENT',
      });

      unknowns.push(
        { question: 'What is the team operational overhead and SRE maturity level for cluster operations?', criticality: 'HIGH' },
        { question: 'What are the inter-service communication latency requirements?', criticality: 'HIGH' },
        { question: 'Is the current monolithic bottlenecks CPU/memory bound or team coordination bound?', criticality: 'BLOCKING' }
      );

      neededEvidence.push(
        {
          id: `${planId}-req1`,
          targetTool: 'web_search',
          actionDescription: 'Inspect Kubernetes operational overhead best practices',
          parameters: { query: 'Kubernetes operational cost complexity and pod disruption budgets' },
          priority: 'IMMEDIATE',
          expectedInsight: 'Assess operational blast radius and cluster maintenance overhead.',
        }
      );

      hypotheses.push(
        {
          id: 'H1',
          proposition: 'Kubernetes provides superior automated pod healing and autoscaling under spiky traffic.',
          expectedEvidenceType: 'WEB',
          status: 'UNTESTED',
        }
      );
    } else {
      // Generic architectural or technical problem
      knowns.push({
        statement: `Problem presented: "${problem.slice(0, 120)}..."`,
        confidence: 0.85,
        source: 'PROBLEM_STATEMENT',
      });

      unknowns.push(
        { question: 'What are the empirical constraints and operational boundary conditions?', criticality: 'HIGH' },
        { question: 'What are the primary tradeoffs between technical feasibility, safety, and ergonomics?', criticality: 'MEDIUM' }
      );

      neededEvidence.push(
        {
          id: `${planId}-req1`,
          targetTool: 'web_search',
          actionDescription: 'Query authoritative specifications for key problem terms',
          parameters: { query: problem.slice(0, 80) },
          priority: 'IMMEDIATE',
          expectedInsight: 'Retrieve technical context and best practice guidelines.',
        }
      );

      hypotheses.push(
        {
          id: 'H1',
          proposition: 'An evidence-backed compromise will minimize risk while satisfying primary technical constraints.',
          expectedEvidenceType: 'WEB',
          status: 'UNTESTED',
        }
      );
    }

    return {
      id: planId,
      problem,
      knowns,
      unknowns,
      neededEvidence,
      hypotheses,
      status: 'PENDING',
      summary: `Investigation plan generated with ${knowns.length} knowns, ${unknowns.length} unknowns, and ${neededEvidence.length} evidence requests.`,
    };
  }

  /**
   * Executes the investigation plan by dispatching evidence requests to registered tools,
   * validating results, and updating the problem brief.
   */
  public async executeInvestigation(problem: string): Promise<InvestigationResult> {
    const startTime = Date.now();
    const plan = await this.createPlan(problem);
    plan.status = 'EXECUTING';

    const evidenceGathered: Evidence[] = [];

    // Dispatch needed evidence requests to tools
    for (const req of plan.neededEvidence) {
      try {
        const result = await this.toolRegistry.executeTool(req.targetTool, req.parameters);
        if (result.success && result.evidenceGenerated) {
          evidenceGathered.push(...result.evidenceGenerated);
        }
      } catch (err) {
        // Continue gathering from remaining tools
      }
    }

    // Ingest all gathered evidence into plan knowns
    evidenceGathered.forEach(ev => {
      ev.claims.forEach(c => {
        plan.knowns.push({
          statement: c.statement,
          evidenceId: ev.id,
          confidence: c.confidence,
          source: ev.source,
        });
      });
    });

    // Update hypotheses statuses
    plan.hypotheses.forEach(h => {
      const hasSupport = evidenceGathered.some(e => e.type === h.expectedEvidenceType);
      if (hasSupport) {
        h.status = 'SUPPORTED';
      }
    });

    // Determine deliberation readiness
    const blockingUnknowns = plan.unknowns.filter(u => u.criticality === 'BLOCKING');
    let readiness: 'READY' | 'PARTIAL' | 'CRITICAL_DATA_MISSING' = 'READY';

    if (evidenceGathered.length === 0 && blockingUnknowns.length > 0) {
      readiness = 'CRITICAL_DATA_MISSING';
      plan.status = 'INSUFFICIENT_DATA';
    } else if (plan.unknowns.length > plan.knowns.length) {
      readiness = 'PARTIAL';
      plan.status = 'COMPLETED';
    } else {
      readiness = 'READY';
      plan.status = 'COMPLETED';
    }

    // Generate comprehensive dilemma brief for MAGI Triad
    const dilemmaBrief = this.formatDilemmaBrief(plan, evidenceGathered, readiness);

    return {
      plan,
      evidenceGathered,
      durationMs: Date.now() - startTime,
      readinessForDeliberation: readiness,
      dilemmaBrief,
    };
  }

  private formatDilemmaBrief(plan: InvestigationPlan, evidence: Evidence[], readiness: string): string {
    const knownsSection = plan.knowns
      .map(k => `  - [CONF ${(k.confidence * 100).toFixed(0)}%] ${k.statement} (Source: ${k.source || 'N/A'})`)
      .join('\n');

    const unknownsSection = plan.unknowns
      .map(u => `  - [${u.criticality}] ${u.question}`)
      .join('\n');

    const hypothesesSection = plan.hypotheses
      .map(h => `  - [${h.id}] (${h.status}): ${h.proposition}`)
      .join('\n');

    const evidenceSection = evidence.length > 0
      ? evidence.map(e => `  * [${e.type}] (Rel: ${e.reliability}) "${e.source}": ${e.content.slice(0, 140)}...`).join('\n')
      : '  (No empirical evidence collected yet)';

    return `=== MAGI V4 INVESTIGATION BRIEF ===\n` +
      `PROBLEM: "${plan.problem}"\n` +
      `STATUS: ${plan.status} | READINESS: [${readiness}]\n\n` +
      `1. WHAT WE KNOW (KNOWN FACTS):\n${knownsSection || '  None established.'}\n\n` +
      `2. WHAT IS MISSING (UNKNOWN VARIABLES):\n${unknownsSection || '  None identified.'}\n\n` +
      `3. EMPIRICAL EVIDENCE COLLECTED (${evidence.length} items):\n${evidenceSection}\n\n` +
      `4. TESTED HYPOTHESES:\n${hypothesesSection || '  None formulated.'}\n` +
      `===================================`;
  }
}

export const globalInvestigationEngine = new InvestigationEngine();
