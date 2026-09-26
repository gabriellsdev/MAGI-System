import { describe, it, expect, beforeEach } from 'vitest';
import { ProblemClassifier } from '../../src/controller/problem-classifier.js';
import { ExecutionPlanner } from '../../src/controller/execution-planner.js';
import { MagiController } from '../../src/controller/magi-controller.js';
import { createMagiSystem } from '../../src/index.js';
import { MockLanguageModelProvider } from '../../src/providers/mock/mock.provider.js';
import { resolvedInRoundOneFixtures } from '../../src/providers/mock/fixtures.js';

describe('V4 Controller — Problem Classification, Planning & Lifecycle', () => {
  let classifier: ProblemClassifier;
  let planner: ExecutionPlanner;

  beforeEach(() => {
    classifier = new ProblemClassifier();
    planner = new ExecutionPlanner();
  });

  it('should classify high-risk database migration as CRITICAL requiring DEEP_INVESTIGATION', () => {
    const classification = classifier.classify('Should we migrate our entire transactional database to MongoDB?');
    expect(classification.complexity).toBe('CRITICAL');
    expect(classification.riskLevel).toBe('CATASTROPHIC');
    expect(classification.requiresInvestigation).toBe(true);
    expect(classification.recommendedPath).toBe('DEEP_INVESTIGATION');
    expect(classification.domain).toBe('DATA_ARCHITECTURE');
  });

  it('should classify simple factual definition as LOW complexity recommending FAST_PATH', () => {
    const classification = classifier.classify('What is the meaning of eventual consistency?');
    expect(classification.complexity).toBe('LOW');
    expect(classification.riskLevel).toBe('LOW');
    expect(classification.requiresInvestigation).toBe(false);
    expect(classification.recommendedPath).toBe('FAST_PATH');
  });

  it('should generate structured execution steps for DEEP_INVESTIGATION', () => {
    const classification = classifier.classify('Should we rewrite our backend in Rust?');
    const steps = planner.createPlan(classification);

    expect(steps.length).toBe(6);
    expect(steps[0].phase).toBe('CLASSIFICATION');
    expect(steps[1].phase).toBe('INVESTIGATION');
    expect(steps[2].phase).toBe('TOOL_EXECUTION');
    expect(steps[3].phase).toBe('DELIBERATION');
    expect(steps[4].phase).toBe('CORE_SYNTHESIS');
    expect(steps[5].phase).toBe('DECISION_RECORD');
  });

  it('should execute FAST_PATH directly without multi-agent deliberation overhead', async () => {
    const controller = new MagiController({
      problemClassifier: classifier,
      executionPlanner: planner,
    });

    const result = await controller.execute('What is Redis?');
    expect(result.executionPath).toBe('FAST_PATH');
    expect(result.fastPathAnswer).toBeDefined();
    expect(result.fastPathAnswer).toContain('[FAST PATH RESOLUTION]');
    expect(result.synthesis).toBeUndefined();
  });

  it('should execute DEEP_INVESTIGATION route through investigation, tools, and mock deliberation', async () => {
    const mockProvider = new MockLanguageModelProvider();
    mockProvider.onGenerate(async req => {
      if (req.schemaName === 'MagiSynthesisOutput') return resolvedInRoundOneFixtures.synthesis;
      if (req.systemInstruction?.includes('MELCHIOR')) return resolvedInRoundOneFixtures.round0.MELCHIOR;
      if (req.systemInstruction?.includes('BALTHASAR')) return resolvedInRoundOneFixtures.round0.BALTHASAR;
      if (req.systemInstruction?.includes('CASPER')) return resolvedInRoundOneFixtures.round0.CASPER;
      return undefined;
    });

    const deliberationEngine = createMagiSystem({ provider: mockProvider });
    const controller = new MagiController({
      problemClassifier: classifier,
      executionPlanner: planner,
      deliberationEngine,
    });

    const result = await controller.execute('Should we migrate our PostgreSQL database to MongoDB?');
    expect(result.executionPath).toBe('DEEP_INVESTIGATION');
    expect(result.investigation).toBeDefined();
    expect(result.investigation!.evidenceGathered.length).toBeGreaterThan(0);
    expect(result.synthesis).toBeDefined();
    expect(result.synthesis?.finalDecision).toBe('CONDITIONAL_PASS');

    // All steps should be completed
    const incompleteSteps = result.steps.filter(s => s.status !== 'COMPLETED');
    expect(incompleteSteps.length).toBe(0);
  });
});
