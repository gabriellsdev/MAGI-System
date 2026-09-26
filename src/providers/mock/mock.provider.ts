import type {
  ILanguageModelProvider,
  StructuredGenerationRequest,
  ProviderResponse,
} from '../provider.interface.js';
import { MagiProviderError } from '../../domain/errors.js';

export type MockHandler = (
  request: StructuredGenerationRequest<unknown>
) => Promise<unknown> | unknown;

export class MockLanguageModelProvider implements ILanguageModelProvider {
  public readonly providerId = 'mock';
  public callHistory: StructuredGenerationRequest<any>[] = [];
  private handlers: MockHandler[] = [];
  private specificResponses: Map<string, unknown> = new Map();
  private shouldFailNextCount = 0;
  private failureError: Error | null = null;

  /**
   * Register a canned response mapped to a specific key (e.g. `MELCHIOR_round_0` or `MAGI_CORE`).
   */
  registerResponse(key: string, data: unknown): this {
    this.specificResponses.set(key, data);
    return this;
  }

  /**
   * Register dynamic handler function.
   */
  onGenerate(handler: MockHandler): this {
    this.handlers.push(handler);
    return this;
  }

  /**
   * Queue artificial provider failure to test retry/resilience logic.
   */
  queueFailure(error: Error, times = 1): this {
    this.failureError = error;
    this.shouldFailNextCount = times;
    return this;
  }

  async generateStructured<T>(request: StructuredGenerationRequest<T>): Promise<ProviderResponse<T>> {
    this.callHistory.push(request);

    if (this.shouldFailNextCount > 0) {
      this.shouldFailNextCount--;
      throw this.failureError || new MagiProviderError('Simulated mock provider failure', this.providerId);
    }

    // 1. Check custom handlers first
    for (const handler of this.handlers) {
      const result = await handler(request);
      if (result !== undefined) {
        const validated = request.schema.parse(result);
        return {
          data: validated,
          rawText: JSON.stringify(validated),
          usage: { promptTokens: 100, completionTokens: 100, totalTokens: 200 },
        };
      }
    }

    // 2. Exact schemaName match takes priority (e.g. MagiSynthesisOutput)
    if (this.specificResponses.has(request.schemaName)) {
      const cannedData = this.specificResponses.get(request.schemaName);
      const validated = request.schema.parse(cannedData);
      return {
        data: validated,
        rawText: JSON.stringify(validated),
        usage: { promptTokens: 100, completionTokens: 100, totalTokens: 200 },
      };
    }

    // 3. Check system instruction matches (e.g. MELCHIOR, BALTHASAR, CASPER)
    for (const [key, cannedData] of this.specificResponses.entries()) {
      if (request.systemInstruction?.includes(key)) {
        const validated = request.schema.parse(cannedData);
        return {
          data: validated,
          rawText: JSON.stringify(validated),
          usage: { promptTokens: 100, completionTokens: 100, totalTokens: 200 },
        };
      }
    }

    throw new MagiProviderError(
      `MockLanguageModelProvider has no registered response for request: ${request.schemaName} (${request.systemInstruction?.slice(0, 40)}...)`,
      this.providerId
    );
  }

  reset(): void {
    this.callHistory = [];
    this.handlers = [];
    this.specificResponses.clear();
    this.shouldFailNextCount = 0;
    this.failureError = null;
  }
}
