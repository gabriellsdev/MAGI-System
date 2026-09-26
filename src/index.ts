// Domain exports
export * from './domain/types.js';
export * from './domain/schemas.js';
export * from './domain/errors.js';

// Provider exports
export * from './providers/provider.interface.js';
export * from './providers/gemini/gemini.config.js';
export * from './providers/gemini/gemini.provider.js';
export * from './providers/mock/mock.provider.js';
export * from './providers/mock/fixtures.js';
export * from './providers/cache/cached.provider.js';

// Agent exports
export * from './agents/agent.interface.js';
export * from './agents/base.agent.js';
export * from './agents/melchior.agent.js';
export * from './agents/balthasar.agent.js';
export * from './agents/casper.agent.js';

// Deliberation exports
export * from './deliberation/disagreement-detector.interface.js';
export * from './deliberation/rule-based-disagreement-detector.js';
export * from './deliberation/llm-disagreement-arbiter.js';
export * from './deliberation/hybrid-disagreement-detector.js';
export * from './deliberation/language-detector.js';
export * from './deliberation/magi-core.js';
export * from './deliberation/deliberation-engine.js';
export * from './deliberation/evidence-auditor.js';
export * from './providers/retry.utils.js';

// Evaluation exports
export * from './evaluation/evaluation.types.js';
export * from './evaluation/llm-judge.js';
export * from './evaluation/eval-runner.js';
export * from './evaluation/ablation.types.js';
export * from './evaluation/ablation-runner.js';

// Routing & Observability exports
export * from './routing/adaptive-router.js';
export * from './observability/observability-tracker.js';

// V4 Cognitive Architecture exports
export * from './knowledge/knowledge.types.js';
export * from './knowledge/source-validator.js';
export * from './knowledge/evidence-store.js';
export * from './tools/tool.interface.js';
export * from './tools/permission-checker.js';
export * from './tools/tool-registry.js';
export * from './tools/builtin/web-search.tool.js';
export * from './tools/builtin/document-reader.tool.js';
export * from './tools/builtin/database-query.tool.js';
export * from './tools/builtin/code-sandbox.tool.js';
export * from './investigation/investigation.types.js';
export * from './investigation/investigation-engine.js';
export * from './controller/controller.types.js';
export * from './controller/problem-classifier.js';
export * from './controller/execution-planner.js';
export * from './controller/magi-controller.js';
export * from './memory/memory.types.js';
export * from './memory/agent-reputation-registry.js';
export * from './memory/outcome-tracker.js';
export * from './memory/decision-memory.js';
export * from './distillation/distillation.types.js';
export * from './distillation/dataset-builder.js';
export * from './distillation/native-model-adapter.js';
export * from './distillation/distillation-benchmark.js';
export * from './telemetry/telemetry.types.js';
export * from './telemetry/webhook-ingestion.js';
export * from './telemetry/contract-heartbeat.js';
export * from './providers/ollama/ollama.config.js';
export * from './providers/ollama/ollama.provider.js';
export * from './providers/ollama/ollama-health.js';
export * from './providers/openai-compatible/openai-compatible.provider.js';
export * from './routing/local-diversity.js';

// Convenience System Factory
import { MelchiorAgent } from './agents/melchior.agent.js';
import { BalthasarAgent } from './agents/balthasar.agent.js';
import { CasperAgent } from './agents/casper.agent.js';
import { MagiCore } from './deliberation/magi-core.js';
import { DeliberationEngine, type DeliberationEngineHooks } from './deliberation/deliberation-engine.js';
import type { ILanguageModelProvider } from './providers/provider.interface.js';
import type { IDisagreementDetector } from './deliberation/disagreement-detector.interface.js';
import { HybridDisagreementDetector } from './deliberation/hybrid-disagreement-detector.js';
import { GeminiProvider } from './providers/gemini/gemini.provider.js';
import { AdaptiveRouter } from './routing/adaptive-router.js';
import type { AgentId } from './domain/types.js';
import { EvidenceStore } from './knowledge/evidence-store.js';
import { ToolRegistry } from './tools/tool-registry.js';
import { InvestigationEngine } from './investigation/investigation-engine.js';
import { MagiController } from './controller/magi-controller.js';
import { DecisionMemoryStore } from './memory/decision-memory.js';
import { OperationalReversalMonitor } from './monitoring/reversal-monitor.js';

export interface MagiSystemOptions {
  provider?: ILanguageModelProvider;
  agentModels?: Partial<Record<AgentId, string>>;
  agentProviders?: Partial<Record<AgentId, ILanguageModelProvider>>;
  disagreementDetector?: IDisagreementDetector;
  useArbiter?: boolean;
  arbiterModel?: string;
  hooks?: DeliberationEngineHooks;
  model?: string;
  maxDeliberationRounds?: number;
}

export function createMagiSystem(options: MagiSystemOptions = {}): DeliberationEngine {
  const provider = options.provider ?? new GeminiProvider({ defaultModel: options.model });

  const melchiorProvider = options.agentProviders?.MELCHIOR ?? provider;
  const balthasarProvider = options.agentProviders?.BALTHASAR ?? provider;
  const casperProvider = options.agentProviders?.CASPER ?? provider;

  const melchiorModel = options.agentModels?.MELCHIOR ?? options.model;
  const balthasarModel = options.agentModels?.BALTHASAR ?? options.model;
  const casperModel = options.agentModels?.CASPER ?? options.model;

  const melchior = new MelchiorAgent(melchiorProvider, melchiorModel);
  const balthasar = new BalthasarAgent(balthasarProvider, balthasarModel);
  const casper = new CasperAgent(casperProvider, casperModel);
  const magiCore = new MagiCore(provider, options.model);

  let detector: IDisagreementDetector | undefined = options.disagreementDetector;
  if (!detector && options.useArbiter) {
    detector = new HybridDisagreementDetector({
      provider,
      arbiterOptions: { model: options.arbiterModel ?? options.model },
    });
  }

  return new DeliberationEngine({
    melchior,
    balthasar,
    casper,
    magiCore,
    disagreementDetector: detector,
    hooks: options.hooks,
    maxDeliberationRounds: options.maxDeliberationRounds,
  });
}

export function createAdaptiveMagiSystem(options: MagiSystemOptions = {}): AdaptiveRouter {
  const provider = options.provider ?? new GeminiProvider({ defaultModel: options.model });
  const deliberationEngine = createMagiSystem(options);
  return new AdaptiveRouter({
    provider,
    deliberationEngine,
    model: options.model,
  });
}

export interface V4MagiSystemOptions extends MagiSystemOptions {
  evidenceStore?: EvidenceStore;
  toolRegistry?: ToolRegistry;
  investigationEngine?: InvestigationEngine;
  decisionMemory?: DecisionMemoryStore;
  reversalMonitor?: OperationalReversalMonitor;
}

export function createV4MagiSystem(options: V4MagiSystemOptions = {}): MagiController {
  const deliberationEngine = createMagiSystem(options);
  return new MagiController({
    deliberationEngine,
    evidenceStore: options.evidenceStore,
    toolRegistry: options.toolRegistry,
    investigationEngine: options.investigationEngine,
    decisionMemory: options.decisionMemory,
    reversalMonitor: options.reversalMonitor,
  });
}

// V4.6 Storage Layer
export {
  MagiStorageManager,
  globalStorageManager,
  JsonFileStore,
  DEFAULT_STORAGE_DIR,
} from './storage/json-storage.js';


