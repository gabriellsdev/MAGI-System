import type {
  ILanguageModelProvider,
  StructuredGenerationRequest,
  ProviderResponse,
  TokenUsage,
} from '../provider.interface.js';
import { MagiProviderError, MagiValidationError } from '../../domain/errors.js';
import { sanitizeJsonString } from '../retry.utils.js';

export interface OpenAiCompatibleConfig {
  baseUrl?: string;
  apiKey?: string;
  defaultModel?: string;
  fallbackModels?: string[];
  providerId?: string;
  timeoutMs?: number;
  maxRetries?: number;
}

export class OpenAiCompatibleProvider implements ILanguageModelProvider {
  public readonly providerId: string;
  public readonly baseUrl: string;
  public readonly defaultModel: string;
  public readonly fallbackModels: string[];
  private apiKey?: string;
  private timeoutMs: number;
  private maxRetries: number;

  constructor(config: OpenAiCompatibleConfig = {}) {
    this.providerId = config.providerId || 'openai-compatible';
    this.baseUrl = (config.baseUrl || process.env.OPENAI_BASE_URL || 'http://localhost:1234/v1').replace(/\/+$/, '');
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
    this.defaultModel = config.defaultModel || process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
    this.fallbackModels = config.fallbackModels || (process.env.GROQ_FALLBACK_MODEL ? [process.env.GROQ_FALLBACK_MODEL] : ['openai/gpt-oss-20b', 'llama-3.3-70b-versatile']);
    this.timeoutMs = config.timeoutMs || 90_000;
    this.maxRetries = config.maxRetries ?? 2;
  }

  async generateStructured<T>(request: StructuredGenerationRequest<T>): Promise<ProviderResponse<T>> {
    const candidateModels = [
      request.model || this.defaultModel,
      ...this.fallbackModels.filter(m => m !== (request.model || this.defaultModel)),
    ];

    let lastError: Error | null = null;

    for (let modelIdx = 0; modelIdx < candidateModels.length; modelIdx++) {
      const currentModel = candidateModels[modelIdx];
      const hasMoreModels = modelIdx < candidateModels.length - 1;

      const messages = [];
      if (request.systemInstruction) {
        messages.push({
          role: 'system',
          content: `${request.systemInstruction}\n\nIMPORTANT: You MUST respond ONLY with a valid JSON object matching the requested schema. Do not include markdown codeblocks or preamble.`,
        });
      }
      for (const m of request.messages) {
        messages.push({ role: m.role, content: m.content });
      }

      const payload: Record<string, unknown> = {
        model: currentModel,
        messages,
        response_format: { type: 'json_object' },
        temperature: request.config?.temperature ?? 0.2,
        top_p: request.config?.topP,
        max_tokens: request.config?.maxOutputTokens,
        stream: false,
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      let shouldFallbackToNextModel = false;

      for (let attempt = 1; attempt <= this.maxRetries + 1; attempt++) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), this.timeoutMs);

          let response: Response;
          try {
            response = await fetch(`${this.baseUrl}/chat/completions`, {
              method: 'POST',
              headers,
              body: JSON.stringify(payload),
              signal: request.config?.abortSignal || controller.signal,
            });
          } catch (fetchErr: unknown) {
            clearTimeout(timer);
            const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
            throw new MagiProviderError(
              `Failed to connect to ${this.providerId} endpoint at ${this.baseUrl} (${msg})`,
              this.providerId,
              undefined,
              fetchErr instanceof Error ? fetchErr : undefined
            );
          }

          clearTimeout(timer);

          if (!response.ok) {
            let errText = '';
            try {
              errText = await response.text();
            } catch {
              errText = response.statusText || 'Unknown error';
            }

            // If rate limited (HTTP 429), attempt to wait out the per-minute window before retrying or falling back
            if (response.status === 429 && attempt <= this.maxRetries) {
              const retryAfterHeader = response.headers.get('retry-after');
              const waitMs = retryAfterHeader ? Math.min(10000, parseFloat(retryAfterHeader) * 1000 || 2000) : 2000 * attempt;
              console.warn(`[${this.providerId}] Rate limited (HTTP 429) on ${currentModel}. Waiting ${waitMs}ms before retry ${attempt}/${this.maxRetries}...`);
              await new Promise(r => setTimeout(r, waitMs));
              continue;
            }

            const isQuotaOrLimitError = response.status === 429 || response.status === 404 || response.status === 400;
            if (isQuotaOrLimitError && hasMoreModels) {
              console.warn(`[${this.providerId}] Model ${currentModel} returned HTTP ${response.status}. Switching to fallback model ${candidateModels[modelIdx + 1]}...`);
              shouldFallbackToNextModel = true;
              lastError = new MagiProviderError(
                `${this.providerId} (${currentModel}) returned HTTP ${response.status}: ${errText}`,
                this.providerId
              );
              break;
            }
            throw new MagiProviderError(
              `${this.providerId} (${currentModel}) returned HTTP ${response.status}: ${errText}`,
              this.providerId
            );
          }

          const data = await response.json() as {
            choices?: Array<{ message?: { content?: string } }>;
            usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
          };

          const rawText = data.choices?.[0]?.message?.content;
          if (!rawText) {
            throw new MagiProviderError(`Empty response received from ${this.providerId} (${currentModel})`, this.providerId);
          }

          const sanitized = sanitizeJsonString(rawText);
          let parsedJson: unknown;
          try {
            parsedJson = JSON.parse(sanitized);
          } catch (jsonErr) {
            throw new MagiValidationError(
              `Failed to parse ${this.providerId} JSON response: ${jsonErr instanceof Error ? jsonErr.message : String(jsonErr)}`,
              rawText
            );
          }

          // Normalize structured JSON to recover from open-source model schema hallucinations (missing agentId, text in stance enum, incomplete claims)
          if (parsedJson && typeof parsedJson === 'object') {
            const pAny = parsedJson as any;
            if (!pAny.agentId) {
              if (request.systemInstruction?.includes('MELCHIOR')) pAny.agentId = 'MELCHIOR';
              else if (request.systemInstruction?.includes('BALTHASAR')) pAny.agentId = 'BALTHASAR';
              else if (request.systemInstruction?.includes('CASPER')) pAny.agentId = 'CASPER';
            }
            const validStances = ['APPROVE', 'REJECT', 'CONDITIONAL', 'PIVOT', 'INCONCLUSIVE'];
            if (pAny.stance && !validStances.includes(pAny.stance)) {
              const rawStance = String(pAny.stance).toUpperCase();
              if (!pAny.summary || pAny.summary.length < 10) pAny.summary = String(pAny.stance);
              if (rawStance.includes('APPROV')) pAny.stance = 'APPROVE';
              else if (rawStance.includes('REJECT')) pAny.stance = 'REJECT';
              else if (rawStance.includes('PIVOT')) pAny.stance = 'PIVOT';
              else if (rawStance.includes('INCONCLUSIV')) pAny.stance = 'INCONCLUSIVE';
              else pAny.stance = 'CONDITIONAL';
            }
            if (typeof pAny.confidence !== 'number') {
              pAny.confidence = 0.85;
            }
            if (Array.isArray(pAny.claims)) {
              pAny.claims = pAny.claims.map((c: any) => {
                if (typeof c === 'string') return { statement: c, requiresEvidence: false };
                if (c && typeof c === 'object') {
                  return {
                    statement: c.statement || c.claim || c.fact || 'General statement',
                    requiresEvidence: typeof c.requiresEvidence === 'boolean' ? c.requiresEvidence : false,
                  };
                }
                return { statement: 'General statement', requiresEvidence: false };
              });
            }
          }

          const validated = request.schema.parse(parsedJson);

          const promptTokens = data.usage?.prompt_tokens || 0;
          const completionTokens = data.usage?.completion_tokens || 0;
          const usage: TokenUsage = {
            promptTokens,
            completionTokens,
            totalTokens: data.usage?.total_tokens || (promptTokens + completionTokens),
          };

          return {
            data: validated,
            rawText,
            usage,
          };
        } catch (err: unknown) {
          lastError = err instanceof Error ? err : new Error(String(err));
          if (shouldFallbackToNextModel) break;
          if (attempt <= this.maxRetries) {
            await new Promise(r => setTimeout(r, 200 * attempt));
          }
        }
      }

      if (shouldFallbackToNextModel) {
        continue;
      }
    }

    throw lastError || new MagiProviderError(`${this.providerId} generation failed after retries across all candidate models`, this.providerId);
  }
}
