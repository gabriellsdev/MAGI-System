export const DEFAULT_OLLAMA_HOST = 'http://localhost:11434';
export const DEFAULT_OLLAMA_TIMEOUT_MS = 120_000; // 2 minutes for local inference
export const DEFAULT_OLLAMA_MAX_RETRIES = 2;

export interface OllamaProviderConfig {
  host?: string;
  defaultModel?: string;
  timeoutMs?: number;
  maxRetries?: number;
}

export const OLLAMA_DEFAULT_ARCHETYPES = {
  MELCHIOR: 'deepseek-r1:8b',     // Reasoning specialist, formal chain-of-thought
  BALTHASAR: 'llama3.1:8b',        // Critical, adversarial, safety and risk evaluation
  CASPER: 'gemma2:9b',             // Pragmatic, human-centric, operational viability
  CORE: 'llama3.1:8b',             // Non-democratic arbiter synthesis
} as const;

export const OLLAMA_LIGHTWEIGHT_ARCHETYPES = {
  MELCHIOR: 'qwen2.5-coder:3b',
  BALTHASAR: 'llama3.2:3b',
  CASPER: 'phi3.5:3.8b',
  CORE: 'llama3.2:3b',
} as const;
