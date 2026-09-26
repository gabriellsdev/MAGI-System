import 'dotenv/config';
import * as http from 'node:http';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createMagiSystem,
  createV4MagiSystem,
  globalEvidenceStore,
  globalInvestigationEngine,
  globalDecisionMemory,
  globalAgentReputationRegistry,
  globalDatasetBuilder,
  globalNativeModelAdapter,
  globalWebhookEngine,
  globalContractHeartbeat,
  checkOllamaHealth,
  createLocalMagiSystem,
  createGroqFreeTierMagiSystem,
  globalStorageManager,
} from '../index.js';
import { MockLanguageModelProvider } from '../providers/mock/mock.provider.js';
import { getThematicFixture } from '../providers/mock/fixtures.js';
import { GeminiProvider } from '../providers/gemini/gemini.provider.js';
import { runComparison } from '../comparison/comparison-engine.js';
import { runBenchmarkSuite } from '../benchmark/benchmark-runner.js';
import { runScientificValidation } from '../evaluation/scientific-validation-runner.js';
import { persistenceService } from '../db/supabase.service.js';
import { InMemoryRateLimiter } from './rate-limiter.js';
import { readJsonBody, validateDeliberationInput } from './validator.js';
import { globalObservabilityTracker } from '../observability/observability-tracker.js';
import { globalCalibrationEngine } from '../calibration/calibration-engine.js';
import { globalReversalMonitor } from '../monitoring/reversal-monitor.js';
import { globalPostMortemEngine } from '../monitoring/post-mortem-engine.js';
import type { ContractStatus } from '../domain/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, '../../public');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
};

// Rate limiter: 15 deliberation/comparison requests per minute per IP
export const deliberationLimiter = new InMemoryRateLimiter({
  windowMs: 60_000,
  maxRequests: 15,
  message: 'MAGI Deliberation rate limit exceeded. Please wait 60 seconds before initiating another deliberation.',
});

// Rate limiter: 60 read/benchmark requests per minute per IP
export const generalLimiter = new InMemoryRateLimiter({
  windowMs: 60_000,
  maxRequests: 60,
  message: 'Request rate limit reached. Please slow down.',
});

function createMockProviderForQuestion(question: string, options?: { delayMs?: number; language?: string }) {
  const mock = new MockLanguageModelProvider();
  const fixture = getThematicFixture(question, options?.language);
  const delay = options?.delayMs || 0;

  mock.onGenerate(async req => {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    if (req.schemaName === 'MagiSynthesisOutput') {
      return fixture.synthesis;
    }
    const isRound1 = req.systemInstruction?.includes('DELIBERATION ROUND 1');
    const isRound2 = req.systemInstruction?.includes('DELIBERATION ROUND 2');
    const fAny = fixture as any;

    if (req.systemInstruction?.includes('MELCHIOR-1')) {
      if (isRound2 && fAny.round2) return fAny.round2.MELCHIOR;
      if (isRound1 && fAny.round1) return fAny.round1.MELCHIOR;
      return (fAny.round0 || fAny.initial).MELCHIOR;
    }
    if (req.systemInstruction?.includes('BALTHASAR-2')) {
      if (isRound2 && fAny.round2) return fAny.round2.BALTHASAR;
      if (isRound1 && fAny.round1) return fAny.round1.BALTHASAR;
      return (fAny.round0 || fAny.initial).BALTHASAR;
    }
    if (req.systemInstruction?.includes('CASPER-3')) {
      if (isRound2 && fAny.round2) return fAny.round2.CASPER;
      if (isRound1 && fAny.round1) return fAny.round1.CASPER;
      return (fAny.round0 || fAny.initial).CASPER;
    }
    return undefined;
  });

  return mock;
}

function sanitizeErrorMessage(err: any): string {
  const msg = err?.message || 'Internal error';
  if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('resource exhausted')) {
    return 'AI provider quota exceeded or rate limited. Try again in a few moments or switch to Mock mode.';
  }
  if (msg.includes('API key') || msg.includes('401') || msg.includes('403')) {
    return 'AI provider authentication failed. Verify API keys (GROQ_API_KEY / GEMINI_API_KEY) in environment settings.';
  }
  if (msg.toLowerCase().includes('abort') || msg.toLowerCase().includes('timeout')) {
    return 'Deliberation request timed out waiting for AI provider response.';
  }
  return msg;
}

export function isVercelEnvironment(): boolean {
  return process.env.VERCEL === '1' || !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.VERCEL_ENV;
}

export function isModelSelectionLocked(): boolean {
  if (process.env.LOCK_MODEL === 'true') return true;
  if (process.env.LOCK_MODEL === 'false') return false;
  return isVercelEnvironment();
}

export function getEffectiveAdminKey(): string {
  return process.env.ADMIN_ACCESS_KEY?.trim() || 'admin';
}

export function resolveEngineAndModel(
  requestedEngine: string | undefined,
  requestedModel: string | undefined,
  isLocked: boolean,
  isAdmin: boolean
): { engine: string; model: string; isMock: boolean } {
  let engine = requestedEngine;
  let model = requestedModel || process.env.DEFAULT_MODEL || (process.env.GROQ_API_KEY ? 'openai/gpt-oss-120b' : 'gemini-3.1-pro-preview');

  // When locked (e.g. on Vercel deployment), public visitors are restricted strictly to mock mode
  if (isLocked && !isAdmin) {
    engine = 'mock';
  }

  if (engine === 'gemini-flash') {
    model = 'gemini-2.5-flash';
  } else if (engine === 'groq-free') {
    model = requestedModel || process.env.GROQ_MODEL || process.env.DEFAULT_MODEL || 'openai/gpt-oss-120b';
  } else if (engine === 'gemini') {
    model = requestedModel || process.env.DEFAULT_MODEL || 'gemini-3.1-pro-preview';
  }

  const isMock = engine === 'mock' || (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY && !engine?.startsWith('ollama') && engine !== 'groq-free');
  if (!engine) {
    engine = isMock ? 'mock' : (process.env.GROQ_API_KEY ? 'groq-free' : (process.env.DEFAULT_ENGINE || 'gemini'));
  }

  return { engine, model, isMock };
}

export interface OperatorSession {
  token: string;
  createdAt: number;
  expiresAt: number;
}

const activeOperatorSessions = new Map<string, OperatorSession>();
export const OPERATOR_SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export function createOperatorSession(): OperatorSession {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const session: OperatorSession = {
    token,
    createdAt: now,
    expiresAt: now + OPERATOR_SESSION_DURATION_MS,
  };
  activeOperatorSessions.set(token, session);
  return session;
}

export function validateOperatorSession(token: string): boolean {
  if (!token) return false;
  const session = activeOperatorSessions.get(token);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    activeOperatorSessions.delete(token);
    return false;
  }
  return true;
}

export function revokeOperatorSession(token: string): boolean {
  return activeOperatorSessions.delete(token);
}

export function getSessionRemainingMs(token: string): number {
  const session = activeOperatorSessions.get(token);
  if (!session) return 0;
  return Math.max(0, session.expiresAt - Date.now());
}

export function extractAuthToken(req: http.IncomingMessage): string | undefined {
  const opToken = req.headers['x-operator-token'];
  if (typeof opToken === 'string' && opToken.trim()) return opToken.trim();

  const adminHeader = req.headers['x-admin-key'];
  if (typeof adminHeader === 'string' && adminHeader.trim()) return adminHeader.trim();

  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader.match(/magi_operator_session=([a-f0-9]+)/i);
    if (match?.[1]) return match[1].trim();
  }
  return undefined;
}

export function verifyAdminKey(req: http.IncomingMessage, bodyKey?: string, queryKey?: string): boolean {
  const serverAdminKey = getEffectiveAdminKey();
  const token = extractAuthToken(req);

  if (token) {
    if (token === serverAdminKey) return true;
    if (validateOperatorSession(token)) return true;
  }
  if (bodyKey) {
    if (bodyKey.trim() === serverAdminKey) return true;
    if (validateOperatorSession(bodyKey.trim())) return true;
  }
  if (queryKey) {
    if (queryKey.trim() === serverAdminKey) return true;
    if (validateOperatorSession(queryKey.trim())) return true;
  }
  return false;
}

export function createMagiRequestHandler() {
  return async (req: http.IncomingMessage, res: http.ServerResponse): Promise<void> => {
    // Enable CORS for API clients
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Fast-Mock, X-Admin-Key, x-admin-key, X-Operator-Token, x-operator-token');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    let pathname = parsedUrl.pathname;
    if (pathname.startsWith('/public/api/')) {
      pathname = pathname.substring(7);
    }
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    try {
      // -------------------------------------------------------------
      // API: GET /api/health
      // -------------------------------------------------------------
      if (req.method === 'GET' && pathname === '/api/health') {
        const queryAdmin = parsedUrl.searchParams.get('admin') || undefined;
        const isVercel = isVercelEnvironment();
        const locked = isModelSelectionLocked();
        const isAdmin = verifyAdminKey(req, undefined, queryAdmin);
        const payload = {
          status: 'ok',
          version: '4.6.0',
          geminiConfigured: !!process.env.GEMINI_API_KEY,
          groqConfigured: !!process.env.GROQ_API_KEY,
          supabaseConfigured: persistenceService.isConfigured(),
          defaultModel: process.env.DEFAULT_MODEL || (process.env.GROQ_API_KEY ? 'openai/gpt-oss-120b' : 'gemini-3.1-pro-preview'),
          defaultEngine: process.env.DEFAULT_ENGINE || (process.env.GROQ_API_KEY ? 'groq-free' : 'gemini'),
          isVercel,
          modelLocked: locked,
          isAdmin,
          hasAdminKeyConfigured: true,
          timestamp: new Date().toISOString(),
        };
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        });
        res.end(JSON.stringify(payload));
        return;
      }

      // -------------------------------------------------------------
      // API: POST /api/auth/operator (Operator Admin Authentication)
      // -------------------------------------------------------------
      if (req.method === 'POST' && pathname === '/api/auth/operator') {
        const bodyRes = await readJsonBody(req);
        const submittedKey = (bodyRes.ok && bodyRes.data?.key !== undefined)
          ? String(bodyRes.data.key).trim()
          : '';
        const expectedKey = getEffectiveAdminKey();

        if (submittedKey && submittedKey === expectedKey) {
          const session = createOperatorSession();
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Set-Cookie': `magi_operator_session=${session.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=1800`,
          });
          res.end(JSON.stringify({
            success: true,
            token: session.token,
            expiresInMs: OPERATOR_SESSION_DURATION_MS,
            expiresAt: new Date(session.expiresAt).toISOString(),
            access: 'operator',
            message: 'Operator access authenticated successfully.',
          }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Credenciais de operador invalidas.',
          }));
        }
        return;
      }

      // -------------------------------------------------------------
      // API: POST /api/auth/logout (Revoke Operator Session)
      // -------------------------------------------------------------
      if (req.method === 'POST' && pathname === '/api/auth/logout') {
        const token = extractAuthToken(req);
        if (token) {
          revokeOperatorSession(token);
        }
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Set-Cookie': 'magi_operator_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0',
        });
        res.end(JSON.stringify({ success: true, message: 'Operator session revoked.' }));
        return;
      }

      // -------------------------------------------------------------
      // API: GET /api/auth/session (Verify Active Operator Session)
      // -------------------------------------------------------------
      if (req.method === 'GET' && pathname === '/api/auth/session') {
        const token = extractAuthToken(req);
        const serverAdminKey = getEffectiveAdminKey();
        const isMaster = !!token && token === serverAdminKey;
        const isValidSession = !!token && validateOperatorSession(token);

        if (isMaster || isValidSession) {
          const remainingMs = isMaster ? OPERATOR_SESSION_DURATION_MS : (token ? getSessionRemainingMs(token) : 0);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            authenticated: true,
            access: 'operator',
            remainingMs,
            expiresAt: new Date(Date.now() + remainingMs).toISOString(),
          }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            authenticated: false,
            access: 'public',
            remainingMs: 0,
            expiresAt: null,
          }));
        }
        return;
      }

      // -------------------------------------------------------------
      // API: GET /api/calibration (Brier Score & Expected Calibration Error)
      // -------------------------------------------------------------
      if (req.method === 'GET' && pathname === '/api/calibration') {
        if (!generalLimiter.apply(req, res)) return;

        const bins = Math.min(10, Math.max(2, Number(parsedUrl.searchParams.get('bins') || '5')));
        const report = globalCalibrationEngine.computeCalibrationReport(bins);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(report));
        return;
      }

      // -------------------------------------------------------------
      // API: GET /api/contracts (Operational Reversal Contracts Registry)
      // -------------------------------------------------------------
      if (req.method === 'GET' && pathname === '/api/contracts') {
        if (!generalLimiter.apply(req, res)) return;

        const status = (parsedUrl.searchParams.get('status') || undefined) as ContractStatus | undefined;
        const decisionId = parsedUrl.searchParams.get('decisionId') || undefined;
        const contracts = globalReversalMonitor.getContracts({ status, decisionId });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ contracts }));
        return;
      }

      // -------------------------------------------------------------
      // API: POST /api/contracts/evaluate (Live Telemetry Evaluation)
      // -------------------------------------------------------------
      if (req.method === 'POST' && pathname === '/api/contracts/evaluate') {
        if (!deliberationLimiter.apply(req, res)) return;

        const bodyRes = await readJsonBody(req);
        if (!bodyRes.ok) {
          res.writeHead(bodyRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: bodyRes.error }));
          return;
        }

        const { metric, value, timestamp } = bodyRes.data || {};
        if (!metric || typeof value !== 'number') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing or invalid "metric" or "value" parameter' }));
          return;
        }

        const tripped = globalReversalMonitor.ingestTelemetry(metric, value, timestamp);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ trippedCount: tripped.length, tripped }));
        return;
      }

      // -------------------------------------------------------------
      // API: GET /api/post-mortems (Reversed Decision Autopsies)
      // -------------------------------------------------------------
      if (req.method === 'GET' && pathname === '/api/post-mortems') {
        if (!generalLimiter.apply(req, res)) return;

        const postMortems = globalPostMortemEngine.getAllPostMortems();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ postMortems }));
        return;
      }

      // -------------------------------------------------------------
      // API: POST /api/decisions/revert (Manual or Contract Decision Reversal)
      // -------------------------------------------------------------
      if (req.method === 'POST' && pathname === '/api/decisions/revert') {
        if (!deliberationLimiter.apply(req, res)) return;

        const bodyRes = await readJsonBody(req);
        if (!bodyRes.ok) {
          res.writeHead(bodyRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: bodyRes.error }));
          return;
        }

        const { decisionId, reason, trippedContractId } = bodyRes.data || {};
        if (!decisionId || !reason) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing required "decisionId" or "reason"' }));
          return;
        }

        const outcome = globalCalibrationEngine.getOutcomeById(decisionId);
        if (outcome) {
          outcome.status = 'REVERTED';
          outcome.reversalReason = reason;
          outcome.trippedContractId = trippedContractId;
          outcome.reversalTimestamp = new Date().toISOString();
          globalCalibrationEngine.recordOutcome(outcome);
        }

        const postMortem = globalPostMortemEngine.analyzeReversal({
          decisionId,
          originalDecision: 'CONDITIONAL_PASS',
          declaredConfidence: outcome?.declaredConfidence ?? 0.85,
          reversalReason: reason,
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, postMortem }));
        return;
      }

      // -------------------------------------------------------------
      // API: GET /api/history (Recent Deliberations from Supabase)
      // -------------------------------------------------------------
      if (req.method === 'GET' && pathname === '/api/history') {
        if (!generalLimiter.apply(req, res)) return;

        const limit = Math.min(Number(parsedUrl.searchParams.get('limit') || '10'), 50);
        const history = await persistenceService.getRecentDeliberations(limit);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ history, configured: persistenceService.isConfigured() }));
        return;
      }

      // -------------------------------------------------------------
      // API: GET /api/benchmark
      // -------------------------------------------------------------
      if (req.method === 'GET' && pathname === '/api/benchmark') {
        if (!generalLimiter.apply(req, res)) return;

        const isMock = parsedUrl.searchParams.get('mock') === 'true' || (!process.env.GEMINI_API_KEY && parsedUrl.searchParams.get('mock') !== 'false');
        const summary = await runBenchmarkSuite({ useMock: isMock });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(summary));
        return;
      }

      // -------------------------------------------------------------
      // API: GET /api/scientific-validation (Comprehensive Validation Report)
      // -------------------------------------------------------------
      if (req.method === 'GET' && pathname === '/api/scientific-validation') {
        if (!generalLimiter.apply(req, res)) return;

        const reportPath = path.resolve(process.cwd(), 'results', 'scientific-validation-report.json');
        try {
          const raw = await fs.readFile(reportPath, 'utf-8');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(raw);
          return;
        } catch {
          // If report file not yet generated, run quick mock validation
          const report = await runScientificValidation({ limit: 5, useMock: true, saveReport: true });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(report));
          return;
        }
      }

      // -------------------------------------------------------------
      // API: GET /api/metrics (Observability & Operational Analytics)
      // -------------------------------------------------------------
      if (req.method === 'GET' && pathname === '/api/metrics') {
        if (!generalLimiter.apply(req, res)) return;

        const metrics = globalObservabilityTracker.getMetrics();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(metrics));
        return;
      }

      // -------------------------------------------------------------
      // API: POST /api/compare (Single Gemini vs MAGI Triad)
      // -------------------------------------------------------------
      if (req.method === 'POST' && pathname === '/api/compare') {
        if (!deliberationLimiter.apply(req, res)) return;

        const bodyRes = await readJsonBody(req);
        if (!bodyRes.ok) {
          res.writeHead(bodyRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: bodyRes.error }));
          return;
        }

        const val = validateDeliberationInput(bodyRes.data);
        if (!val.valid) {
          res.writeHead(val.statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: val.error }));
          return;
        }

        try {
          const isMock = val.data.mock === true || (!process.env.GEMINI_API_KEY && val.data.mock !== false);
          const report = await runComparison(val.data.question, { useMock: isMock, language: val.data.language });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(report));
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: sanitizeErrorMessage(err) }));
        }
        return;
      }

      // -------------------------------------------------------------
      // API: POST /api/deliberate/stream (Server-Sent Events)
      // -------------------------------------------------------------
      if (req.method === 'POST' && pathname === '/api/deliberate/stream') {
        if (!deliberationLimiter.apply(req, res)) return;

        const bodyRes = await readJsonBody(req);
        if (!bodyRes.ok) {
          res.writeHead(bodyRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: bodyRes.error }));
          return;
        }

        const val = validateDeliberationInput(bodyRes.data);
        if (!val.valid) {
          res.writeHead(val.statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: val.error }));
          return;
        }

        const queryAdmin = parsedUrl.searchParams.get('admin') || undefined;
        const locked = isModelSelectionLocked();
        const isAdmin = verifyAdminKey(req, val.data.adminKey, queryAdmin);

        const { engine, model, isMock } = resolveEngineAndModel(
          val.data.engine || (val.data.mock ? 'mock' : undefined),
          val.data.model,
          locked,
          isAdmin
        );
        const language = val.data.language || undefined;

        // Set up SSE headers with anti-buffering headers
        res.writeHead(200, {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        });

        // Send immediate SSE keep-alive comment to keep serverless/reverse proxies open
        res.write(': keep-alive\n\n');
        const pingInterval = setInterval(() => {
          try {
            res.write(': ping\n\n');
          } catch {
            clearInterval(pingInterval);
          }
        }, 5000);

        req.on('close', () => {
          clearInterval(pingInterval);
        });

        const sendEvent = (event: string, payload: any) => {
          res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
          if (typeof (res as any).flush === 'function') {
            (res as any).flush();
          }
        };

        const isFast = process.env.NODE_ENV === 'test' || req.headers['x-fast-mock'] === 'true' || parsedUrl.searchParams.get('fast') === 'true';
        const delayMs = isFast ? 0 : 250;

        try {
          const hooks = {
            onRoundStart: (roundNumber: number, title: string) => {
              sendEvent('round_start', { roundNumber, title });
            },
            onAgentStart: (roundNumber: number, agentId: any) => {
              sendEvent('agent_start', { roundNumber, agentId });
            },
            onAgentCompleted: (roundNumber: number, output: any) => {
              sendEvent('agent_complete', { roundNumber, output });
            },
            onDisagreementDetected: (roundNumber: number, report: any) => {
              sendEvent('disagreement', { roundNumber, report });
            },
            onConsensusReached: (roundNumber: number, report: any) => {
              sendEvent('consensus', { roundNumber, report });
            },
            onCoreSynthesisStart: () => {
              sendEvent('synthesis_start', { message: 'Initiating MagiCore arbitration...' });
            },
          };

          let magi: any;
          if (engine === 'ollama-balanced' || engine === 'ollama-light') {
            const health = await checkOllamaHealth();
            if (!health.available) {
              throw new Error(
                `Ollama daemon is offline or unreachable at ${health.host}. Start Ollama ('ollama serve') before deliberating with local models.`
              );
            }
            if (health.models.length === 0) {
              throw new Error(
                `No models are installed in Ollama. Run 'ollama pull llama3.2:3b' in your terminal to install a model.`
              );
            }
            const preset = engine === 'ollama-balanced' ? 'BALANCED_8B' : 'LIGHTWEIGHT_3B';
            magi = createLocalMagiSystem({
              preset,
              hooks,
              installedModels: health.models,
              maxDeliberationRounds: val.data.fastMode ? 0 : 1,
            });
          } else if (engine === 'groq-free') {
            magi = createGroqFreeTierMagiSystem(process.env.GROQ_API_KEY, {
              hooks,
              maxDeliberationRounds: val.data.fastMode ? 0 : 2,
            });
          } else {
            const provider = isMock
              ? createMockProviderForQuestion(val.data.question, { delayMs, language })
              : new GeminiProvider({ apiKey: process.env.GEMINI_API_KEY, defaultModel: model });

            magi = createMagiSystem({
              provider,
              model,
              hooks,
              maxDeliberationRounds: val.data.fastMode ? 0 : 2,
            });
          }

          const result = await magi.run(val.data.question, { language });
          globalObservabilityTracker.recordExecution(result);
          sendEvent('complete', { result });

          // Persist deliberation trajectory and agent analyses to Supabase in background (non-blocking)
          persistenceService.saveDeliberation(result).catch(err => {
            console.warn('[MAGI PERSISTENCE] Background save error:', err);
          });
        } catch (err: any) {
          sendEvent('error', { error: sanitizeErrorMessage(err) });
        } finally {
          clearInterval(pingInterval);
          res.end();
        }
        return;
      }

      // -------------------------------------------------------------
      // API: POST /api/deliberate (Standard JSON)
      // -------------------------------------------------------------
      if (req.method === 'POST' && pathname === '/api/deliberate') {
        if (!deliberationLimiter.apply(req, res)) return;

        const bodyRes = await readJsonBody(req);
        if (!bodyRes.ok) {
          res.writeHead(bodyRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: bodyRes.error }));
          return;
        }

        const val = validateDeliberationInput(bodyRes.data);
        if (!val.valid) {
          res.writeHead(val.statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: val.error }));
          return;
        }

        const queryAdmin = parsedUrl.searchParams.get('admin') || undefined;
        const locked = isModelSelectionLocked();
        const isAdmin = verifyAdminKey(req, val.data.adminKey, queryAdmin);

        const { engine, model, isMock } = resolveEngineAndModel(
          (bodyRes.data as any).engine || (val.data.mock ? 'mock' : undefined),
          val.data.model,
          locked,
          isAdmin
        );
        const language = val.data.language || undefined;

        try {
          let magi: any;
          if (engine === 'ollama-balanced' || engine === 'ollama-light') {
            const health = await checkOllamaHealth();
            if (!health.available) {
              throw new Error(
                `Ollama daemon is offline or unreachable at ${health.host}. Start Ollama ('ollama serve') before deliberating with local models.`
              );
            }
            if (health.models.length === 0) {
              throw new Error(
                `No models are installed in Ollama. Run 'ollama pull llama3.2:3b' in your terminal to install a model.`
              );
            }
            const preset = engine === 'ollama-balanced' ? 'BALANCED_8B' : 'LIGHTWEIGHT_3B';
            magi = createLocalMagiSystem({
              preset,
              installedModels: health.models,
              maxDeliberationRounds: val.data.fastMode ? 0 : 1,
            });
          } else if (engine === 'groq-free') {
            magi = createGroqFreeTierMagiSystem(process.env.GROQ_API_KEY, {
              maxDeliberationRounds: val.data.fastMode ? 0 : 2,
            });
          } else {
            const provider = isMock
              ? createMockProviderForQuestion(val.data.question, { language })
              : new GeminiProvider({ apiKey: process.env.GEMINI_API_KEY, defaultModel: model });

            magi = createMagiSystem({
              provider,
              model,
              maxDeliberationRounds: val.data.fastMode ? 0 : 2,
            });
          }

          const result = await magi.run(val.data.question, { language });
          globalObservabilityTracker.recordExecution(result);

          // Persist deliberation trajectory and agent analyses to Supabase
          persistenceService.saveDeliberation(result).catch(err => {
            console.warn('[MAGI PERSISTENCE] Background save error:', err);
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (error: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: sanitizeErrorMessage(error),
          }));
        }
        return;
      }

      // -------------------------------------------------------------
      // API: GET /api/v4/evidence (Knowledge Layer Repository)
      // -------------------------------------------------------------
      if (req.method === 'GET' && pathname === '/api/v4/evidence') {
        if (!generalLimiter.apply(req, res)) return;

        const evidence = globalEvidenceStore.getAll();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          count: evidence.length,
          averageReliability: globalEvidenceStore.getAverageReliability(),
          evidence,
        }));
        return;
      }

      // -------------------------------------------------------------
      // API: POST /api/v4/investigate (Investigation Engine Deconstruction)
      // -------------------------------------------------------------
      if (req.method === 'POST' && pathname === '/api/v4/investigate') {
        if (!deliberationLimiter.apply(req, res)) return;

        const bodyRes = await readJsonBody(req);
        if (!bodyRes.ok) {
          res.writeHead(bodyRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: bodyRes.error }));
          return;
        }

        const val = validateDeliberationInput(bodyRes.data);
        if (!val.valid) {
          res.writeHead(val.statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: val.error }));
          return;
        }

        try {
          const invResult = await globalInvestigationEngine.executeInvestigation(val.data.question);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(invResult));
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: sanitizeErrorMessage(err) }));
        }
        return;
      }

      // -------------------------------------------------------------
      // API: POST /api/v4/execute (Full V4 Controller Cognitive Pipeline)
      // -------------------------------------------------------------
      if (req.method === 'POST' && pathname === '/api/v4/execute') {
        if (!deliberationLimiter.apply(req, res)) return;

        const bodyRes = await readJsonBody(req);
        if (!bodyRes.ok) {
          res.writeHead(bodyRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: bodyRes.error }));
          return;
        }

        const val = validateDeliberationInput(bodyRes.data);
        if (!val.valid) {
          res.writeHead(val.statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: val.error }));
          return;
        }

        try {
          const isMock = val.data.mock === true || (!process.env.GEMINI_API_KEY && val.data.mock !== false);
          const language = val.data.language || undefined;
          const model = val.data.model || process.env.DEFAULT_MODEL || 'gemini-3.1-pro-preview';
          const isFast = process.env.NODE_ENV === 'test' || req.headers['x-fast-mock'] === 'true';
          const delayMs = isFast ? 0 : 250;

          const provider = isMock
            ? createMockProviderForQuestion(val.data.question, { delayMs, language })
            : new GeminiProvider({ apiKey: process.env.GEMINI_API_KEY, defaultModel: model });

          const controller = createV4MagiSystem({
            provider,
            model,
          });

          const executionResult = await controller.execute(val.data.question, { language });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(executionResult));
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: sanitizeErrorMessage(err) }));
        }
        return;
      }

      // -------------------------------------------------------------
      // API: GET /api/v4/memory/decisions (Stored Decisions & Summary)
      // -------------------------------------------------------------
      if (req.method === 'GET' && pathname === '/api/v4/memory/decisions') {
        if (!generalLimiter.apply(req, res)) return;

        const domain = parsedUrl.searchParams.get('domain') || undefined;
        const status = (parsedUrl.searchParams.get('status') as any) || undefined;
        const searchQuery = parsedUrl.searchParams.get('q') || undefined;

        const decisions = globalDecisionMemory.queryDecisions({ domain, status, searchQuery });
        const summary = globalDecisionMemory.getMemorySummary();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ summary, decisions }));
        return;
      }

      // -------------------------------------------------------------
      // API: POST /api/v4/memory/track-outcome (Outcome Tracking & Autopsy)
      // -------------------------------------------------------------
      if (req.method === 'POST' && pathname === '/api/v4/memory/track-outcome') {
        if (!deliberationLimiter.apply(req, res)) return;

        const bodyRes = await readJsonBody(req);
        if (!bodyRes.ok) {
          res.writeHead(bodyRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: bodyRes.error }));
          return;
        }

        const { decisionId, actualOutcome, observedMetrics, status, reversalReason, trippedContractId } = bodyRes.data || {};
        if (!decisionId || !actualOutcome) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing required "decisionId" or "actualOutcome"' }));
          return;
        }

        try {
          const result = globalDecisionMemory.trackDecisionOutcome({
            decisionId,
            actualOutcome,
            observedMetrics,
            status,
            reversalReason,
            trippedContractId,
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, result }));
        } catch (err: any) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: sanitizeErrorMessage(err) }));
        }
        return;
      }

      // -------------------------------------------------------------
      // API: GET /api/v4/memory/reputation (Agent Reputation Profiles)
      // -------------------------------------------------------------
      if (req.method === 'GET' && pathname === '/api/v4/memory/reputation') {
        if (!generalLimiter.apply(req, res)) return;

        const profiles = globalAgentReputationRegistry.getAllProfiles();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ profiles }));
        return;
      }

      // -------------------------------------------------------------
      // API: GET /api/v4/dataset/stats (Training Dataset Statistics)
      // -------------------------------------------------------------
      if (req.method === 'GET' && pathname === '/api/v4/dataset/stats') {
        if (!generalLimiter.apply(req, res)) return;

        const stats = globalDatasetBuilder.getDatasetStats();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(stats));
        return;
      }

      // -------------------------------------------------------------
      // API: POST /api/v4/dataset/export (SFT / DPO / ShareGPT Export)
      // -------------------------------------------------------------
      if (req.method === 'POST' && pathname === '/api/v4/dataset/export') {
        if (!generalLimiter.apply(req, res)) return;

        const bodyRes = await readJsonBody(req);
        const format = (bodyRes.ok && bodyRes.data?.format) || 'sft';
        const minQuality = bodyRes.ok ? bodyRes.data?.minQualityScore : undefined;
        const maxDelta = bodyRes.ok ? bodyRes.data?.maxDelta : undefined;
        const domains = bodyRes.ok ? bodyRes.data?.domains : undefined;

        const result = globalDatasetBuilder.export(format, {
          minQualityScore: minQuality,
          maxDelta,
          domains,
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
        return;
      }

      // -------------------------------------------------------------
      // API: POST /api/v4/distilled/deliberate (Single-Pass Native Inference)
      // -------------------------------------------------------------
      if (req.method === 'POST' && pathname === '/api/v4/distilled/deliberate') {
        if (!deliberationLimiter.apply(req, res)) return;

        const bodyRes = await readJsonBody(req);
        if (!bodyRes.ok) {
          res.writeHead(bodyRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: bodyRes.error }));
          return;
        }

        const val = validateDeliberationInput(bodyRes.data);
        if (!val.valid) {
          res.writeHead(val.statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: val.error }));
          return;
        }

        try {
          const distilledResult = await globalNativeModelAdapter.deliberate(val.data.question, {
            language: val.data.language,
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(distilledResult));
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: sanitizeErrorMessage(err) }));
        }
        return;
      }

      // -------------------------------------------------------------
      // API: POST /api/v4/telemetry/webhook (Prometheus, Grafana, Datadog Webhook Ingestion)
      // -------------------------------------------------------------
      if (req.method === 'POST' && pathname === '/api/v4/telemetry/webhook') {
        if (!generalLimiter.apply(req, res)) return;

        const bodyRes = await readJsonBody(req);
        if (!bodyRes.ok) {
          res.writeHead(bodyRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: bodyRes.error }));
          return;
        }

        const headers: Record<string, string> = {};
        for (const [k, v] of Object.entries(req.headers)) {
          if (typeof v === 'string') headers[k] = v;
        }

        const result = globalWebhookEngine.parseAndIngest(bodyRes.data, headers);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
        return;
      }

      // -------------------------------------------------------------
      // API: GET /api/v4/telemetry/heartbeat/status (Heartbeat Monitor Status)
      // -------------------------------------------------------------
      if (req.method === 'GET' && pathname === '/api/v4/telemetry/heartbeat/status') {
        if (!generalLimiter.apply(req, res)) return;

        const status = globalContractHeartbeat.getStatus();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status));
        return;
      }

      // -------------------------------------------------------------
      // API: POST /api/v4/telemetry/heartbeat/tick (Manual Trigger of Heartbeat Cycle)
      // -------------------------------------------------------------
      if (req.method === 'POST' && pathname === '/api/v4/telemetry/heartbeat/tick') {
        if (!deliberationLimiter.apply(req, res)) return;

        try {
          const report = await globalContractHeartbeat.tick();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, report }));
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: sanitizeErrorMessage(err) }));
        }
        return;
      }

      // -------------------------------------------------------------
      // API: GET /api/v4/local/status (Ollama Local Daemon Health & Models)
      // -------------------------------------------------------------
      if (req.method === 'GET' && pathname === '/api/v4/local/status') {
        if (!generalLimiter.apply(req, res)) return;

        if (isVercelEnvironment()) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            available: false,
            host: 'cloud',
            models: [],
            reason: 'Ollama local engine is not available on cloud serverless environment.'
          }));
          return;
        }

        const host = parsedUrl.searchParams.get('host') || undefined;
        const health = await checkOllamaHealth(host);

        res.writeHead(health.available ? 200 : 503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(health));
        return;
      }

      // -------------------------------------------------------------
      // API: GET /api/v4/storage/status (JSON File Storage Status)
      // -------------------------------------------------------------
      if (req.method === 'GET' && pathname === '/api/v4/storage/status') {
        if (!generalLimiter.apply(req, res)) return;

        const status = globalStorageManager.getStatus();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status));
        return;
      }

      // -------------------------------------------------------------
      // API: POST /api/v4/storage/backup (Snapshot / Drive Sync)
      // -------------------------------------------------------------
      if (req.method === 'POST' && pathname === '/api/v4/storage/backup') {
        if (!generalLimiter.apply(req, res)) return;

        const bodyRes = await readJsonBody(req);
        const targetDir = bodyRes.ok ? (bodyRes.data?.targetDir || bodyRes.data?.destinationPath) : undefined;
        if (!targetDir) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing required parameter "targetDir" or "destinationPath"' }));
          return;
        }

        try {
          const result = globalStorageManager.backupTo(targetDir);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: sanitizeErrorMessage(err) }));
        }
        return;
      }

      // -------------------------------------------------------------
      // Static File Serving (from public/)
      // -------------------------------------------------------------
      if (req.method === 'GET') {
        if (pathname?.startsWith('/_vercel/')) {
          res.writeHead(200, {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          });
          res.end('/* Vercel analytics local stub */');
          return;
        }

        let filePath = pathname === '/' ? '/index.html' : pathname;
        if (filePath.startsWith('/public/')) {
          filePath = filePath.substring(7);
        }
        const safePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
        const fullPath = path.join(PUBLIC_DIR, safePath);

        try {
          const stats = await fs.stat(fullPath);
          if (stats.isDirectory()) {
            res.writeHead(404);
            res.end('Not found');
            return;
          }

          const ext = path.extname(fullPath).toLowerCase();
          const contentType = MIME_TYPES[ext] || 'application/octet-stream';
          const content = await fs.readFile(fullPath);

          res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          });
          res.end(content);
          return;
        } catch {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('File not found');
          return;
        }
      }

      // Fallback
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.end('Method Not Allowed');
    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message || 'Server error' }));
    }
  };
}

export function createServer() {
  const handler = createMagiRequestHandler();
  return http.createServer(handler);
}

// If invoked directly from terminal
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const server = createServer();
  server.listen(PORT, () => {
    console.log('\n\x1b[1m\x1b[36m' + `
  ███╗   ███╗ █████╗  ██████╗ ██╗
  ████╗ ████║██╔══██╗██╔════╝ ██║
  ██╔████╔██║███████║██║  ███╗██║
  ██║╚██╔╝██║██╔══██║██║   ██║██║
  ██║ ╚═╝ ██║██║  ██║╚██████╔╝██║
  ╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝
  SUPERCOMPUTER DELIBERATION SYSTEM — V4.6.0 PRODUCTION
    ` + '\x1b[0m');
    console.log(`\x1b[32m[ONLINE]\x1b[0m MAGI Web Server active at: \x1b[1m\x1b[35mhttp://localhost:${PORT}\x1b[0m`);
    console.log(`    Web Interface:    http://localhost:${PORT}/`);
    console.log(`    Health Check:     http://localhost:${PORT}/api/health`);
    console.log(`    Deliberate API:   POST http://localhost:${PORT}/api/deliberate`);
    console.log(`    Streaming SSE:    POST http://localhost:${PORT}/api/deliberate/stream`);
    console.log(`    Model Comparison: POST http://localhost:${PORT}/api/compare`);
    console.log(`    Delib. History:   GET http://localhost:${PORT}/api/history`);
    console.log(`    Benchmark Suite:  GET http://localhost:${PORT}/api/benchmark\n`);
  });
}
