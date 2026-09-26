import type { z } from 'zod';

export interface ProviderMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerationConfig {
  temperature?: number;
  topP?: number;
  maxOutputTokens?: number;
  abortSignal?: AbortSignal;
}

export interface StructuredGenerationRequest<T> {
  model?: string;
  systemInstruction?: string;
  messages: ProviderMessage[];
  schema: z.ZodType<T>;
  schemaName: string;
  config?: GenerationConfig;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ProviderResponse<T> {
  data: T;
  rawText: string;
  usage?: TokenUsage;
}

export interface ILanguageModelProvider {
  readonly providerId: string;
  generateStructured<T>(request: StructuredGenerationRequest<T>): Promise<ProviderResponse<T>>;
}
