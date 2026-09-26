import type {
  ILanguageModelProvider,
  StructuredGenerationRequest,
  ProviderResponse,
  TokenUsage,
} from '../provider.interface.js';
import {
  DEFAULT_OLLAMA_HOST,
  DEFAULT_OLLAMA_TIMEOUT_MS,
  DEFAULT_OLLAMA_MAX_RETRIES,
  type OllamaProviderConfig,
} from './ollama.config.js';
import { getProviderJsonSchema } from '../../domain/schemas.js';
import { MagiProviderError, MagiValidationError } from '../../domain/errors.js';
import { sanitizeJsonString, tryRepairTruncatedJson } from '../retry.utils.js';

export class OllamaLanguageModelProvider implements ILanguageModelProvider {
  public readonly providerId = 'ollama';
  public readonly host: string;
  public readonly defaultModel: string;
  private timeoutMs: number;
  private maxRetries: number;

  constructor(config: OllamaProviderConfig = {}) {
    this.host = (config.host || process.env.OLLAMA_HOST || DEFAULT_OLLAMA_HOST).replace(/\/+$/, '');
    this.defaultModel = config.defaultModel || 'llama3.1:8b';
    this.timeoutMs = config.timeoutMs ?? DEFAULT_OLLAMA_TIMEOUT_MS;
    this.maxRetries = config.maxRetries ?? DEFAULT_OLLAMA_MAX_RETRIES;
  }

  async generateStructured<T>(request: StructuredGenerationRequest<T>): Promise<ProviderResponse<T>> {
    const model = request.model || this.defaultModel;
    const jsonSchema = getProviderJsonSchema(request.schema, request.schemaName);

    // Prepare messages including system instructions
    const messages = [];
    if (request.systemInstruction) {
      messages.push({ role: 'system', content: request.systemInstruction });
    }
    for (const m of request.messages) {
      messages.push({ role: m.role, content: m.content });
    }

    const payload = {
      model,
      messages,
      format: jsonSchema,
      options: {
        temperature: request.config?.temperature ?? 0.2,
        top_p: request.config?.topP,
        num_predict: request.config?.maxOutputTokens ?? 512,
        num_ctx: 2048,
      },
      stream: false,
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries + 1; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);

        let response: Response;
        try {
          response = await fetch(`${this.host}/api/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(payload),
            signal: request.config?.abortSignal || controller.signal,
          });
        } catch (fetchErr: unknown) {
          clearTimeout(timer);
          const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
          throw new MagiProviderError(
            `Failed to connect to Ollama daemon at ${this.host} (${msg}). Ensure Ollama is running locally ('ollama serve').`,
            this.providerId,
            undefined,
            fetchErr instanceof Error ? fetchErr : undefined
          );
        }

        clearTimeout(timer);

        if (!response.ok) {
          const errorText = await response.text();
          if (response.status === 404 || errorText.toLowerCase().includes('model')) {
            throw new MagiProviderError(
              `Model "${model}" was not found on local Ollama server at ${this.host}. Please install it using: 'ollama pull ${model}'.`,
              this.providerId
            );
          }
          throw new MagiProviderError(
            `Ollama server returned HTTP ${response.status}: ${errorText}`,
            this.providerId
          );
        }

        const data = await response.json() as {
          message?: { content?: string };
          prompt_eval_count?: number;
          eval_count?: number;
        };

        const rawText = data.message?.content;
        if (!rawText) {
          throw new MagiProviderError('Empty response message content received from Ollama', this.providerId);
        }

        // Parse and validate structured output against Zod schema with repair fallback
        const sanitized = sanitizeJsonString(rawText);
        let parsedJson: unknown;
        try {
          parsedJson = JSON.parse(sanitized);
        } catch (jsonErr) {
          try {
            const repaired = tryRepairTruncatedJson(rawText);
            parsedJson = JSON.parse(repaired);
          } catch {
            throw new MagiValidationError(
              `Failed to parse Ollama JSON response: ${jsonErr instanceof Error ? jsonErr.message : String(jsonErr)}`,
              rawText
            );
          }
        }

        const validated = request.schema.parse(parsedJson);

        const promptTokens = data.prompt_eval_count || 0;
        const completionTokens = data.eval_count || 0;
        const usage: TokenUsage = {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        };

        return {
          data: validated,
          rawText,
          usage,
        };
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        // If error is configuration or model missing, do not retry
        if (err instanceof MagiProviderError && (err.message.includes('not set') || err.message.includes('not found') || err.message.includes('pull'))) {
          throw err;
        }
        if (attempt <= this.maxRetries) {
          await new Promise(r => setTimeout(r, 200 * attempt));
        }
      }
    }

    throw lastError || new MagiProviderError('Ollama generation failed after retries', this.providerId);
  }
}
