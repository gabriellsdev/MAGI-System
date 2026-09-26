export interface GeminiProviderConfig {
  apiKey?: string;
  defaultModel?: string;
  maxRetries?: number;
  timeoutMs?: number;
}

export const DEFAULT_GEMINI_MODEL = process.env.DEFAULT_MODEL || 'gemini-3.1-pro-preview';
export const DEFAULT_GEMINI_TIMEOUT_MS = 60000;
export const DEFAULT_GEMINI_MAX_RETRIES = 3;

/**
 * Calculates estimated cost in USD for Google Gemini models.
 * Rates (per 1M tokens for context <= 128k):
 * - Pro (3.1/2.5 Pro): $1.25 Input, $5.00 Output
 * - Flash (2.5/2.0 Flash): $0.15 Input, $0.60 Output
 */
export function calculateGeminiCost(model: string, promptTokens: number, completionTokens: number): number {
  const isFlash = model.toLowerCase().includes('flash');
  const inputRatePerMillion = isFlash ? 0.15 : 1.25;
  const outputRatePerMillion = isFlash ? 0.60 : 5.00;

  const inputCost = (promptTokens / 1_000_000) * inputRatePerMillion;
  const outputCost = (completionTokens / 1_000_000) * outputRatePerMillion;

  return Number((inputCost + outputCost).toFixed(6));
}
