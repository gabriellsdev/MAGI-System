import type { DeliberationEngine } from '../deliberation/deliberation-engine.js';
import { createMagiSystem, type MagiSystemOptions } from '../index.js';
import { OllamaLanguageModelProvider } from '../providers/ollama/ollama.provider.js';
import {
  DEFAULT_OLLAMA_HOST,
  OLLAMA_DEFAULT_ARCHETYPES,
  OLLAMA_LIGHTWEIGHT_ARCHETYPES,
} from '../providers/ollama/ollama.config.js';
import { OpenAiCompatibleProvider } from '../providers/openai-compatible/openai-compatible.provider.js';
import type { AgentId } from '../domain/types.js';

export type LocalDiversityPresetName = 'BALANCED_8B' | 'LIGHTWEIGHT_3B' | 'REASONING_FOCUSED';

export interface LocalMagiOptions extends Omit<MagiSystemOptions, 'provider' | 'agentProviders' | 'agentModels'> {
  host?: string;
  preset?: LocalDiversityPresetName;
  customModels?: {
    MELCHIOR?: string;
    BALTHASAR?: string;
    CASPER?: string;
    CORE?: string;
  };
  installedModels?: string[];
  maxDeliberationRounds?: number;
}

export const LOCAL_DIVERSITY_PRESETS: Record<LocalDiversityPresetName, Record<AgentId | 'CORE', string>> = {
  BALANCED_8B: {
    MELCHIOR: OLLAMA_DEFAULT_ARCHETYPES.MELCHIOR, // deepseek-r1:8b
    BALTHASAR: OLLAMA_DEFAULT_ARCHETYPES.BALTHASAR, // llama3.1:8b
    CASPER: OLLAMA_DEFAULT_ARCHETYPES.CASPER,       // gemma2:9b
    CORE: OLLAMA_DEFAULT_ARCHETYPES.CORE,           // llama3.1:8b
  },
  LIGHTWEIGHT_3B: {
    MELCHIOR: OLLAMA_LIGHTWEIGHT_ARCHETYPES.MELCHIOR, // qwen2.5-coder:3b
    BALTHASAR: OLLAMA_LIGHTWEIGHT_ARCHETYPES.BALTHASAR, // llama3.2:3b
    CASPER: OLLAMA_LIGHTWEIGHT_ARCHETYPES.CASPER,       // phi3.5:3.8b
    CORE: OLLAMA_LIGHTWEIGHT_ARCHETYPES.CORE,           // llama3.2:3b
  },
  REASONING_FOCUSED: {
    MELCHIOR: 'deepseek-r1:8b',
    BALTHASAR: 'qwen2.5-coder:7b',
    CASPER: 'llama3.1:8b',
    CORE: 'deepseek-r1:8b',
  },
};

/**
 * Resolves requested model against currently installed Ollama models with graceful fallback.
 */
export function resolveModelWithFallback(
  preferredModel: string,
  installedModels?: string[],
  fallbackIndex: number = 0
): string {
  if (!installedModels || installedModels.length === 0) {
    return preferredModel;
  }

  // 1. Direct match (e.g. 'llama3.2:3b' === 'llama3.2:3b')
  const directMatch = installedModels.find(m => m.toLowerCase() === preferredModel.toLowerCase());
  if (directMatch) return directMatch;

  // 2. Base name match without tag (e.g. 'llama3.2' matches 'llama3.2:3b' or 'llama3.2:latest')
  const preferredBase = preferredModel.split(':')[0].toLowerCase();
  const baseMatch = installedModels.find(m => m.split(':')[0].toLowerCase() === preferredBase);
  if (baseMatch) return baseMatch;

  // 3. Family keyword match (e.g. 'llama3.1' matches 'llama3.2:3b', 'qwen2.5-coder' matches 'qwen2.5:7b')
  const baseClean = preferredBase.replace(/[:_]/g, '-');
  const family = baseClean.split('-')[0].replace(/[\d.]/g, '');
  if (family.length >= 4) {
    const familyMatch = installedModels.find(m => m.toLowerCase().includes(family));
    if (familyMatch) return familyMatch;
  }

  // 4. Fallback to installed models
  const fallback = installedModels[fallbackIndex % installedModels.length];
  return fallback;
}

/**
 * Creates a complete MAGI Deliberation system powered 100% by local Ollama models with zero API cost
 */
export function createLocalMagiSystem(options: LocalMagiOptions = {}): DeliberationEngine {
  const host = options.host || process.env.OLLAMA_HOST || DEFAULT_OLLAMA_HOST;
  const preset = LOCAL_DIVERSITY_PRESETS[options.preset || 'BALANCED_8B'];

  const melchiorTarget = options.customModels?.MELCHIOR || preset.MELCHIOR;
  const balthasarTarget = options.customModels?.BALTHASAR || preset.BALTHASAR;
  const casperTarget = options.customModels?.CASPER || preset.CASPER;
  const coreTarget = options.customModels?.CORE || preset.CORE;

  const melchiorModel = resolveModelWithFallback(melchiorTarget, options.installedModels, 0);
  const balthasarModel = resolveModelWithFallback(balthasarTarget, options.installedModels, 1);
  const casperModel = resolveModelWithFallback(casperTarget, options.installedModels, 2);
  const coreModel = resolveModelWithFallback(coreTarget, options.installedModels, 3);

  const melchiorProvider = new OllamaLanguageModelProvider({ host, defaultModel: melchiorModel });
  const balthasarProvider = new OllamaLanguageModelProvider({ host, defaultModel: balthasarModel });
  const casperProvider = new OllamaLanguageModelProvider({ host, defaultModel: casperModel });
  const coreProvider = new OllamaLanguageModelProvider({ host, defaultModel: coreModel });

  return createMagiSystem({
    provider: coreProvider,
    agentProviders: {
      MELCHIOR: melchiorProvider,
      BALTHASAR: balthasarProvider,
      CASPER: casperProvider,
    },
    agentModels: {
      MELCHIOR: melchiorModel,
      BALTHASAR: balthasarModel,
      CASPER: casperModel,
    },
    model: coreModel,
    hooks: options.hooks,
    useArbiter: options.useArbiter,
    arbiterModel: coreModel,
    maxDeliberationRounds: options.maxDeliberationRounds ?? 1,
  });
}

/**
 * Creates a MAGI Deliberation system powered by Groq / Production AI models
 * Defaults to high-capacity openai/gpt-oss-120b with seamless fallback to openai/gpt-oss-20b
 */
export function createGroqFreeTierMagiSystem(apiKey?: string, options: Omit<MagiSystemOptions, 'provider'> = {}): DeliberationEngine {
  const key = apiKey || process.env.GROQ_API_KEY;
  const baseUrl = 'https://api.groq.com/openai/v1';

  const primaryModel = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
  const fallbackModel = process.env.GROQ_FALLBACK_MODEL || 'openai/gpt-oss-20b';
  const fallbackModels = [fallbackModel, 'qwen/qwen3.8-27b'];

  const melchiorProvider = new OpenAiCompatibleProvider({ baseUrl, apiKey: key, defaultModel: primaryModel, fallbackModels, providerId: 'groq-melchior' });
  const balthasarProvider = new OpenAiCompatibleProvider({ baseUrl, apiKey: key, defaultModel: primaryModel, fallbackModels, providerId: 'groq-balthasar' });
  const casperProvider = new OpenAiCompatibleProvider({ baseUrl, apiKey: key, defaultModel: primaryModel, fallbackModels, providerId: 'groq-casper' });
  const coreProvider = new OpenAiCompatibleProvider({ baseUrl, apiKey: key, defaultModel: primaryModel, fallbackModels, providerId: 'groq-core' });

  return createMagiSystem({
    provider: coreProvider,
    agentProviders: {
      MELCHIOR: melchiorProvider,
      BALTHASAR: balthasarProvider,
      CASPER: casperProvider,
    },
    agentModels: {
      MELCHIOR: primaryModel,
      BALTHASAR: primaryModel,
      CASPER: primaryModel,
    },
    model: primaryModel,
    hooks: options.hooks,
    useArbiter: options.useArbiter,
    arbiterModel: primaryModel,
  });
}
