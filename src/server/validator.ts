import * as http from 'node:http';

export interface DeliberationInput {
  question: string;
  model?: string;
  language?: string;
  mock?: boolean;
  engine?: string;
  preset?: string;
  fastMode?: boolean;
  adminKey?: string;
}

export interface ValidationSuccess {
  valid: true;
  data: DeliberationInput;
}

export interface ValidationFailure {
  valid: false;
  error: string;
  statusCode: number;
}

export type ValidationResult = ValidationSuccess | ValidationFailure;

export const MAX_QUESTION_LENGTH = 2500;
export const MIN_QUESTION_LENGTH = 3;
export const MAX_BODY_BYTES = 65536; // 64 KB

/**
 * Validates the parsed deliberation input parameters.
 */
export function validateDeliberationInput(data: any): ValidationResult {
  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      error: 'Invalid request body: expected JSON object.',
      statusCode: 400,
    };
  }

  const rawQuestion = data.question;
  if (typeof rawQuestion !== 'string' || !rawQuestion.trim()) {
    return {
      valid: false,
      error: 'Field "question" is required and cannot be empty.',
      statusCode: 400,
    };
  }

  const question = rawQuestion.trim();
  if (question.length < MIN_QUESTION_LENGTH) {
    return {
      valid: false,
      error: `Question is too short (${question.length} chars). Minimum length is ${MIN_QUESTION_LENGTH} characters.`,
      statusCode: 400,
    };
  }

  if (question.length > MAX_QUESTION_LENGTH) {
    return {
      valid: false,
      error: `Question exceeds maximum allowed length of ${MAX_QUESTION_LENGTH} characters (received ${question.length}).`,
      statusCode: 413,
    };
  }

  let model: string | undefined = undefined;
  if (data.model !== undefined) {
    if (typeof data.model !== 'string' || data.model.trim().length === 0 || data.model.length > 100) {
      return {
        valid: false,
        error: 'Invalid "model" parameter.',
        statusCode: 400,
      };
    }
    model = data.model.trim();
  }

  let language: string | undefined = undefined;
  if (data.language !== undefined) {
    if (typeof data.language !== 'string' || data.language.length > 50) {
      return {
        valid: false,
        error: 'Invalid "language" parameter.',
        statusCode: 400,
      };
    }
    language = data.language.trim();
  }

  let engine: string | undefined = undefined;
  if (data.engine !== undefined && typeof data.engine === 'string') {
    engine = data.engine.trim();
  }

  let preset: string | undefined = undefined;
  if (data.preset !== undefined && typeof data.preset === 'string') {
    preset = data.preset.trim();
  }

  let adminKey: string | undefined = undefined;
  if (data.adminKey !== undefined && typeof data.adminKey === 'string') {
    adminKey = data.adminKey.trim();
  }

  return {
    valid: true,
    data: {
      question,
      model,
      language,
      mock: data.mock === true,
      engine,
      preset,
      fastMode: data.fastMode === true,
      adminKey,
    },
  };
}

/**
 * Safely reads and parses JSON request body with size limits.
 */
export async function readJsonBody(
  req: http.IncomingMessage,
  maxBytes: number = MAX_BODY_BYTES
): Promise<{ ok: true; data: any } | { ok: false; error: string; statusCode: number }> {
  const anyReq = req as any;

  // 1. If body was already parsed by Vercel serverless runtime or middleware
  if (anyReq.body !== undefined && anyReq.body !== null) {
    if (typeof anyReq.body === 'object') {
      return { ok: true, data: anyReq.body };
    }
    if (typeof anyReq.body === 'string') {
      if (!anyReq.body.trim()) return { ok: true, data: {} };
      try {
        return { ok: true, data: JSON.parse(anyReq.body) };
      } catch {
        return { ok: false, error: 'Malformed JSON payload in request body.', statusCode: 400 };
      }
    }
  }

  // 2. If the request stream has already ended
  if (req.readableEnded || req.complete) {
    return { ok: true, data: anyReq.body || {} };
  }

  return new Promise(resolve => {
    let body = '';
    let bytesReceived = 0;
    let exceeded = false;

    req.on('data', chunk => {
      if (exceeded) return;
      bytesReceived += chunk.length;
      if (bytesReceived > maxBytes) {
        exceeded = true;
        resolve({
          ok: false,
          error: `Payload exceeds limit of ${maxBytes} bytes.`,
          statusCode: 413,
        });
        req.destroy();
        return;
      }
      body += chunk;
    });

    req.on('end', () => {
      if (exceeded) return;
      if (!body.trim()) {
        resolve({ ok: true, data: {} });
        return;
      }
      try {
        const data = JSON.parse(body);
        resolve({ ok: true, data });
      } catch {
        resolve({
          ok: false,
          error: 'Malformed JSON payload in request body.',
          statusCode: 400,
        });
      }
    });

    req.on('error', err => {
      if (!exceeded) {
        resolve({
          ok: false,
          error: `Failed to read request stream: ${err.message}`,
          statusCode: 400,
        });
      }
    });
  });
}
