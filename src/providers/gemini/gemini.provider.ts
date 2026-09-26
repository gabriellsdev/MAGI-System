import { GoogleGenAI } from '@google/genai';
import type {
  ILanguageModelProvider,
  StructuredGenerationRequest,
  ProviderResponse,
  ProviderMessage,
} from '../provider.interface.js';
import {
  DEFAULT_GEMINI_MODEL,
  DEFAULT_GEMINI_TIMEOUT_MS,
  DEFAULT_GEMINI_MAX_RETRIES,
  type GeminiProviderConfig,
} from './gemini.config.js';
import { getProviderJsonSchema } from '../../domain/schemas.js';
import { MagiProviderError, MagiValidationError } from '../../domain/errors.js';
import { withRetry, sanitizeJsonString } from '../retry.utils.js';

export class GeminiProvider implements ILanguageModelProvider {
  public readonly providerId = 'gemini';
  private client: GoogleGenAI;
  public readonly defaultModel: string;
  private apiKey: string;
  private maxRetries: number;
  private timeoutMs: number;

  constructor(config: GeminiProviderConfig = {}) {
    this.apiKey = config.apiKey !== undefined ? config.apiKey : (process.env.GEMINI_API_KEY || '');
    this.defaultModel = config.defaultModel || DEFAULT_GEMINI_MODEL;
    this.maxRetries = config.maxRetries ?? DEFAULT_GEMINI_MAX_RETRIES;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_GEMINI_TIMEOUT_MS;

    this.client = new GoogleGenAI({
      apiKey: this.apiKey || 'unconfigured_key',
    });
  }

  async generateStructured<T>(request: StructuredGenerationRequest<T>): Promise<ProviderResponse<T>> {
    if (!this.apiKey) {
      throw new MagiProviderError(
        'GEMINI_API_KEY is not set. Please provide an API key via environment variable, .env file, or --api-key argument.',
        this.providerId
      );
    }

    const model = request.model || this.defaultModel;
    const jsonSchema = getProviderJsonSchema(request.schema, request.schemaName);
    const contents = this.formatContents(request.messages);

    // Timeout signal setup
    const abortSignal = request.config?.abortSignal || AbortSignal.timeout(this.timeoutMs);

    const modelLower = model.toLowerCase();
    const isGemini3 = modelLower.includes('3.') || modelLower.includes('3-') || modelLower.includes('gemini-3');
    const isGemini25 = modelLower.includes('2.5');

    const thinkingConfig = isGemini3
      ? { thinkingLevel: 'LOW' as const }
      : isGemini25
      ? { thinkingBudget: 1024 }
      : undefined;

    // Primary execution with exponential backoff for transient 429/5xx errors
    const executeCall = async () => {
      const response = await this.client.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: request.systemInstruction,
          temperature: request.config?.temperature ?? 0.2,
          topP: request.config?.topP ?? 0.95,
          maxOutputTokens: request.config?.maxOutputTokens,
          responseMimeType: 'application/json',
          responseSchema: jsonSchema as any,
          thinkingConfig: thinkingConfig as any,
          abortSignal,
        },
      });

      const rawText = response.text || '';
      if (!rawText.trim()) {
        throw new MagiProviderError('Received empty response from Gemini API', this.providerId);
      }

      return {
        rawText,
        usage: response.usageMetadata ? {
          promptTokens: response.usageMetadata.promptTokenCount ?? 0,
          completionTokens: response.usageMetadata.candidatesTokenCount ?? 0,
          totalTokens: response.usageMetadata.totalTokenCount ?? 0,
        } : undefined,
      };
    };

    let result;
    try {
      result = await withRetry(executeCall, { maxRetries: this.maxRetries });
    } catch (error: any) {
      if (error instanceof MagiProviderError) {
        throw error;
      }
      throw new MagiProviderError(
        error.message || 'Error occurred while calling Gemini API',
        this.providerId,
        error.status || error.statusCode,
        error
      );
    }

    // Sanitize and parse JSON
    const sanitized = sanitizeJsonString(result.rawText);

    try {
      const parsedJson = JSON.parse(sanitized);
      const validatedData = request.schema.parse(parsedJson);
      return {
        data: validatedData,
        rawText: result.rawText,
        usage: result.usage,
      };
    } catch (firstError: any) {
      // 1-Shot Automated Schema Repair Loop
      try {
        const repairPrompt =
          `Your previous output produced a schema validation error:\n${firstError.message}\n\n` +
          `Previous output:\n${sanitized}\n\n` +
          `Please correct the JSON and return ONLY the valid JSON object adhering strictly to the schema.`;

        const repairResponse = await this.client.models.generateContent({
          model,
          contents: [
            ...contents,
            { role: 'model', parts: [{ text: result.rawText }] },
            { role: 'user', parts: [{ text: repairPrompt }] },
          ],
          config: {
            systemInstruction: request.systemInstruction,
            temperature: 0.1,
            responseMimeType: 'application/json',
            responseSchema: jsonSchema as any,
            abortSignal,
          },
        });

        const repairedRaw = sanitizeJsonString(repairResponse.text || '');
        const repairedJson = JSON.parse(repairedRaw);
        const validatedData = request.schema.parse(repairedJson);

        return {
          data: validatedData,
          rawText: repairResponse.text || repairedRaw,
          usage: result.usage,
        };
      } catch (repairError: any) {
        throw new MagiValidationError(
          `Gemini output could not be validated against schema (${request.schemaName}) even after repair: ${firstError.message}`,
          { original: firstError, repair: repairError, rawText: result.rawText }
        );
      }
    }
  }

  private formatContents(messages: ProviderMessage[]) {
    return messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));
  }
}
