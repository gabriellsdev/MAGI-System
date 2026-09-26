import type { ProblemClassification, ExecutionPlanStep } from './controller.types.js';

export class ExecutionPlanner {
  /**
   * Plans the ordered sequence of execution phases based on problem classification and risk.
   */
  public createPlan(classification: ProblemClassification): ExecutionPlanStep[] {
    const steps: ExecutionPlanStep[] = [
      {
        stepNumber: 1,
        phase: 'CLASSIFICATION',
        action: `Classify problem complexity (${classification.complexity}) and risk level (${classification.riskLevel}).`,
        status: 'COMPLETED',
      },
    ];

    if (classification.recommendedPath === 'FAST_PATH') {
      steps.push({
        stepNumber: 2,
        phase: 'CORE_SYNTHESIS',
        action: 'Execute fast-path analytical resolution without multi-round deliberation overhead.',
        status: 'PENDING',
      });
      return steps;
    }

    if (classification.recommendedPath === 'DEEP_INVESTIGATION') {
      steps.push(
        {
          stepNumber: 2,
          phase: 'INVESTIGATION',
          action: 'Deconstruct problem into Known Facts, Unknown Variables, and Evidence Gathering Requests.',
          status: 'PENDING',
        },
        {
          stepNumber: 3,
          phase: 'TOOL_EXECUTION',
          action: 'Dispatch requests to sandboxed Tool Layer (Web, Database, Docs, Code) and ingest validated evidence.',
          status: 'PENDING',
        },
        {
          stepNumber: 4,
          phase: 'DELIBERATION',
          action: 'Initiate Triad Deliberation (Melchior, Balthasar, Casper) grounded in empirical Knowledge Layer evidence.',
          status: 'PENDING',
        },
        {
          stepNumber: 5,
          phase: 'CORE_SYNTHESIS',
          action: 'Synthesize authoritative verdict via MAGI Core with Epistemic Audit, Minority Report, and Reversal Contracts.',
          status: 'PENDING',
        },
        {
          stepNumber: 6,
          phase: 'DECISION_RECORD',
          action: 'Persist comprehensive decision telemetry record with attached evidence references and uncertainty profile.',
          status: 'PENDING',
        }
      );
      return steps;
    }

    // Default: STANDARD_TRIAD
    steps.push(
      {
        stepNumber: 2,
        phase: 'DELIBERATION',
        action: 'Execute standard dialectic rounds among Melchior, Balthasar, and Casper.',
        status: 'PENDING',
      },
      {
        stepNumber: 3,
        phase: 'CORE_SYNTHESIS',
        action: 'Synthesize authoritative verdict via MAGI Core.',
        status: 'PENDING',
      },
      {
        stepNumber: 4,
        phase: 'DECISION_RECORD',
        action: 'Persist structured decision record.',
        status: 'PENDING',
      }
    );

    return steps;
  }
}

export const globalExecutionPlanner = new ExecutionPlanner();
