import type { DeliberationEngine, DeliberationRunOptions } from '../deliberation/deliberation-engine.js';
import type { MagiSynthesisResult } from '../domain/types.js';
import type {
  ProblemClassification,
  ExecutionPlanStep,
  ControllerExecutionResult,
} from './controller.types.js';
import { ProblemClassifier, globalProblemClassifier } from './problem-classifier.js';
import { ExecutionPlanner, globalExecutionPlanner } from './execution-planner.js';
import { InvestigationEngine, globalInvestigationEngine } from '../investigation/investigation-engine.js';
import { EvidenceStore, globalEvidenceStore } from '../knowledge/evidence-store.js';
import { ToolRegistry, globalToolRegistry } from '../tools/tool-registry.js';
import type { InvestigationResult } from '../investigation/investigation.types.js';
import { DecisionMemoryStore, globalDecisionMemory } from '../memory/decision-memory.js';
import { OperationalReversalMonitor, globalReversalMonitor } from '../monitoring/reversal-monitor.js';

export interface MagiControllerOptions {
  problemClassifier?: ProblemClassifier;
  executionPlanner?: ExecutionPlanner;
  investigationEngine?: InvestigationEngine;
  evidenceStore?: EvidenceStore;
  toolRegistry?: ToolRegistry;
  deliberationEngine?: DeliberationEngine;
  decisionMemory?: DecisionMemoryStore;
  reversalMonitor?: OperationalReversalMonitor;
}

export class MagiController {
  private problemClassifier: ProblemClassifier;
  private executionPlanner: ExecutionPlanner;
  private investigationEngine: InvestigationEngine;
  private evidenceStore: EvidenceStore;
  private toolRegistry: ToolRegistry;
  private deliberationEngine?: DeliberationEngine;
  private decisionMemory: DecisionMemoryStore;
  private reversalMonitor: OperationalReversalMonitor;

  constructor(options: MagiControllerOptions = {}) {
    this.problemClassifier = options.problemClassifier ?? globalProblemClassifier;
    this.executionPlanner = options.executionPlanner ?? globalExecutionPlanner;
    this.investigationEngine = options.investigationEngine ?? globalInvestigationEngine;
    this.evidenceStore = options.evidenceStore ?? globalEvidenceStore;
    this.toolRegistry = options.toolRegistry ?? globalToolRegistry;
    this.deliberationEngine = options.deliberationEngine;
    this.decisionMemory = options.decisionMemory ?? globalDecisionMemory;
    this.reversalMonitor = options.reversalMonitor ?? globalReversalMonitor;
  }

  /**
   * Directly classifies a problem without running the full pipeline.
   */
  public classify(problem: string): ProblemClassification {
    return this.problemClassifier.classify(problem);
  }

  /**
   * Plans the execution phases for a given problem.
   */
  public plan(problem: string): { classification: ProblemClassification; steps: ExecutionPlanStep[] } {
    const classification = this.classify(problem);
    const steps = this.executionPlanner.createPlan(classification);
    return { classification, steps };
  }

  /**
   * Triggers an explicit investigation cycle on a problem.
   */
  public async investigate(problem: string): Promise<InvestigationResult> {
    return this.investigationEngine.executeInvestigation(problem);
  }

  /**
   * Executes the full V4 Cognitive Lifecycle:
   * Problem -> Classification -> Risk Assessment -> Planning -> (Investigation & Tools) -> Triad Deliberation -> Core Synthesis -> Decision Record
   */
  public async execute(problem: string, options: DeliberationRunOptions = {}): Promise<ControllerExecutionResult> {
    const startTime = Date.now();
    const classification = this.problemClassifier.classify(problem);
    const steps = this.executionPlanner.createPlan(classification);

    let investigationResult: InvestigationResult | undefined;
    let synthesisResult: MagiSynthesisResult | undefined;
    let fastPathAnswer: string | undefined;

    // 1. FAST PATH ROUTE
    if (classification.recommendedPath === 'FAST_PATH') {
      const step2 = steps.find(s => s.stepNumber === 2);
      if (step2) step2.status = 'RUNNING';

      fastPathAnswer = `[FAST PATH RESOLUTION] Query: "${problem}"\n` +
        `Classification: ${classification.domain} (Complexity: LOW, Risk: LOW).\n` +
        `Verdict: Direct factual clarification resolved without multi-agent deliberation overhead.`;

      if (step2) {
        step2.status = 'COMPLETED';
        step2.durationMs = Date.now() - startTime;
      }

      return {
        problem,
        classification,
        executionPath: 'FAST_PATH',
        fastPathAnswer,
        steps,
        totalDurationMs: Date.now() - startTime,
        evidenceCount: this.evidenceStore.count,
      };
    }

    // 2. DEEP INVESTIGATION ROUTE
    if (classification.recommendedPath === 'DEEP_INVESTIGATION') {
      // Step 2: Investigation Planning
      const step2 = steps.find(s => s.phase === 'INVESTIGATION');
      if (step2) step2.status = 'RUNNING';
      const invStart = Date.now();

      // Step 3: Tool Execution & Evidence Collection
      const step3 = steps.find(s => s.phase === 'TOOL_EXECUTION');
      if (step3) step3.status = 'RUNNING';

      investigationResult = await this.investigationEngine.executeInvestigation(problem);

      if (step2) {
        step2.status = 'COMPLETED';
        step2.durationMs = Date.now() - invStart;
      }
      if (step3) {
        step3.status = 'COMPLETED';
        step3.durationMs = investigationResult.durationMs;
      }

      // Step 4: Triad Deliberation with Empirical Brief
      const step4 = steps.find(s => s.phase === 'DELIBERATION');
      if (step4) step4.status = 'RUNNING';
      const delibStart = Date.now();

      if (this.deliberationEngine) {
        synthesisResult = await this.deliberationEngine.run(investigationResult.dilemmaBrief, {
          ...options,
          domain: classification.domain,
        });
      }

      if (step4) {
        step4.status = 'COMPLETED';
        step4.durationMs = Date.now() - delibStart;
      }

      // Step 5: Core Synthesis
      const step5 = steps.find(s => s.phase === 'CORE_SYNTHESIS');
      if (step5) {
        step5.status = 'COMPLETED';
        step5.durationMs = synthesisResult?.metadata?.durationMs ?? 0;
      }

      // Step 6: Decision Record
      const step6 = steps.find(s => s.phase === 'DECISION_RECORD');
      if (step6) step6.status = 'RUNNING';
      if (synthesisResult?.auditableDecision) {
        const stored = this.decisionMemory.recordDecision({
          decision: synthesisResult.auditableDecision,
          problem,
          domain: classification.domain,
          decisionId: synthesisResult.decisionId,
          verdict: synthesisResult.finalDecision,
          declaredConfidence: synthesisResult.auditableDecision.confidence,
          synthesisSummary: synthesisResult.synthesisSummary,
          metadata: {
            dissentingAgent: synthesisResult.minorityReport?.dissentingAgent,
            deliberationRoundsCount: synthesisResult.deliberationRoundsCount,
          },
        });
        if (synthesisResult.minorityReport?.contracts?.length) {
          this.reversalMonitor.registerDecisionContracts(stored.decisionId, synthesisResult.minorityReport.contracts);
        }
      }
      if (step6) {
        step6.status = 'COMPLETED';
      }

      return {
        problem,
        classification,
        executionPath: 'DEEP_INVESTIGATION',
        investigation: investigationResult,
        synthesis: synthesisResult,
        steps,
        totalDurationMs: Date.now() - startTime,
        evidenceCount: this.evidenceStore.count,
      };
    }

    // 3. STANDARD TRIAD ROUTE
    const stepDelib = steps.find(s => s.phase === 'DELIBERATION');
    if (stepDelib) stepDelib.status = 'RUNNING';
    const delibStart = Date.now();

    if (this.deliberationEngine) {
      synthesisResult = await this.deliberationEngine.run(problem, {
        ...options,
        domain: classification.domain,
      });
    }

    if (stepDelib) {
      stepDelib.status = 'COMPLETED';
      stepDelib.durationMs = Date.now() - delibStart;
    }

    const stepSynth = steps.find(s => s.phase === 'CORE_SYNTHESIS');
    if (stepSynth) {
      stepSynth.status = 'COMPLETED';
      stepSynth.durationMs = synthesisResult?.metadata?.durationMs ?? 0;
    }

    const stepRec = steps.find(s => s.phase === 'DECISION_RECORD');
    if (stepRec) stepRec.status = 'RUNNING';
    if (synthesisResult?.auditableDecision) {
      const stored = this.decisionMemory.recordDecision({
        decision: synthesisResult.auditableDecision,
        problem,
        domain: classification.domain,
        decisionId: synthesisResult.decisionId,
        verdict: synthesisResult.finalDecision,
        declaredConfidence: synthesisResult.auditableDecision.confidence,
        synthesisSummary: synthesisResult.synthesisSummary,
        metadata: {
          dissentingAgent: synthesisResult.minorityReport?.dissentingAgent,
          deliberationRoundsCount: synthesisResult.deliberationRoundsCount,
        },
      });
      if (synthesisResult.minorityReport?.contracts?.length) {
        this.reversalMonitor.registerDecisionContracts(stored.decisionId, synthesisResult.minorityReport.contracts);
      }
    }
    if (stepRec) stepRec.status = 'COMPLETED';

    return {
      problem,
      classification,
      executionPath: 'STANDARD_TRIAD',
      synthesis: synthesisResult,
      steps,
      totalDurationMs: Date.now() - startTime,
      evidenceCount: this.evidenceStore.count,
    };
  }
}
