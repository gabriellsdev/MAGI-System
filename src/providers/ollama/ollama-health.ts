import { DEFAULT_OLLAMA_HOST } from './ollama.config.js';

export interface OllamaHealthReport {
  available: boolean;
  host: string;
  models: string[];
  latencyMs: number;
  error?: string;
}

/**
 * Pings Ollama local daemon and retrieves list of installed models
 */
export async function checkOllamaHealth(host: string = DEFAULT_OLLAMA_HOST, timeoutMs: number = 3000): Promise<OllamaHealthReport> {
  const startTime = Date.now();
  const normalizedHost = host.replace(/\/+$/, '');

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(`${normalizedHost}/api/tags`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      return {
        available: false,
        host: normalizedHost,
        models: [],
        latencyMs: Date.now() - startTime,
        error: `Ollama returned HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json() as { models?: Array<{ name: string }> };
    const modelNames = (data.models || []).map(m => m.name);

    return {
      available: true,
      host: normalizedHost,
      models: modelNames,
      latencyMs: Date.now() - startTime,
    };
  } catch (err: unknown) {
    return {
      available: false,
      host: normalizedHost,
      models: [],
      latencyMs: Date.now() - startTime,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
