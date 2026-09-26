export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  retryOn?: (error: any) => boolean;
}

/**
 * Execute an async operation with exponential backoff and jitter.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const initialDelay = options.initialDelayMs ?? 1000;
  const maxDelay = options.maxDelayMs ?? 10000;
  const factor = options.backoffFactor ?? 2;

  const defaultRetryOn = (err: any) => {
    // Retry on HTTP 429 (rate limit), 500, 502, 503, 504, or network timeout/reset
    const status = err?.status ?? err?.statusCode ?? err?.cause?.status;
    if (status === 429 || status === 500 || status === 502 || status === 503 || status === 504) {
      return true;
    }
    const message = (err?.message || '').toLowerCase();
    return (
      message.includes('rate limit') ||
      message.includes('quota') ||
      message.includes('too many requests') ||
      message.includes('resource_exhausted') ||
      message.includes('timeout') ||
      message.includes('econnreset')
    );
  };

  const isRetryable = options.retryOn ?? defaultRetryOn;

  let attempt = 0;
  let delay = initialDelay;

  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;
      if (attempt > maxRetries || !isRetryable(error)) {
        throw error;
      }

      // Calculate jittered delay: delay * (0.8 + 0.4 * Math.random())
      const jitteredDelay = Math.min(
        maxDelay,
        delay * (0.8 + Math.random() * 0.4)
      );

      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
      delay = Math.min(maxDelay, delay * factor);
    }
  }
}

/**
 * Strips markdown code blocks (e.g. ```json ... ```) and extracts valid JSON substring.
 */
export function sanitizeJsonString(raw: string): string {
  let text = raw.trim();

  // Remove markdown code fences ```json ... ``` or ``` ... ```
  if (text.startsWith('```')) {
    const lines = text.split('\n');
    // Remove first line
    lines.shift();
    // Remove last line if it is ```
    if (lines.length > 0 && lines[lines.length - 1].trim().endsWith('```')) {
      lines.pop();
    }
    text = lines.join('\n').trim();
  }

  // If there is extraneous text before the first '{' or after the last '}', trim it
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.substring(firstBrace, lastBrace + 1);
  }

  return text;
}

/**
 * Gracefully repairs potentially truncated JSON strings by balancing brackets,
 * quotes, and removing trailing unfinished keys or commas.
 */
export function tryRepairTruncatedJson(raw: string): string {
  let text = raw.trim();

  // Strip markdown code fences if present
  if (text.startsWith('```')) {
    const lines = text.split('\n');
    lines.shift();
    if (lines.length > 0 && lines[lines.length - 1].trim().endsWith('```')) {
      lines.pop();
    }
    text = lines.join('\n').trim();
  }

  // Trim text before the first '{'
  const firstBrace = text.indexOf('{');
  if (firstBrace !== -1) {
    text = text.substring(firstBrace);
  }

  // Quick check if already valid
  try {
    JSON.parse(text);
    return text;
  } catch (_) {
    // Proceed to repair
  }

  // Remove incomplete trailing key or value, e.g. `"type":` or `"type": `
  text = text.replace(/,\s*"[^"]*":?\s*$/, '');
  text = text.replace(/:\s*$/, '');
  text = text.replace(/,\s*$/, '');

  let inString = false;
  let escape = false;
  const stack: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === '{') stack.push('}');
    else if (ch === '[') stack.push(']');
    else if (ch === '}' || ch === ']') {
      if (stack.length && stack[stack.length - 1] === ch) {
        stack.pop();
      }
    }
  }

  // If ends inside an open string, close it
  if (inString) {
    text += '"';
  }

  // Re-check trailing dangling colon or comma
  text = text.replace(/,\s*$/, '');

  // Close open brackets in LIFO order
  while (stack.length > 0) {
    text += stack.pop();
  }

  return text;
}
