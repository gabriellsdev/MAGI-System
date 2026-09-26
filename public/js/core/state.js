// =========================================================================
// MAGI SUPERCOMPUTER // CENTRAL APPLICATION STATE
// Unified session, UI, engine configuration, query, and run execution state
// =========================================================================
import { STORAGE_KEYS } from './constants.js';

function checkInitialOperatorAuth() {
  if (typeof localStorage === 'undefined') return false;
  const token = localStorage.getItem(STORAGE_KEYS.ADMIN_KEY) || '';
  if (!token) return false;
  const expiresAt = localStorage.getItem('magi_session_expires_at');
  if (expiresAt) {
    const expTime = new Date(expiresAt).getTime();
    if (!isNaN(expTime) && Date.now() > expTime) {
      localStorage.removeItem(STORAGE_KEYS.ADMIN_KEY);
      localStorage.removeItem('magi_session_expires_at');
      return false;
    }
  }
  return true;
}

const safeGetStorage = (key) => typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;

export const state = {
  session: {
    id: `SESSION-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    access: checkInitialOperatorAuth() ? 'operator' : 'public',
    token: safeGetStorage(STORAGE_KEYS.ADMIN_KEY) || null,
    expiresAt: safeGetStorage('magi_session_expires_at') || null,
  },
  ui: {
    visualMode: safeGetStorage(STORAGE_KEYS.VIEW_MODE) || 'command', // 'command' | 'anime' | 'tactical'
    view: 'diagnostic', // 'diagnostic' | 'tactical'
    language: safeGetStorage(STORAGE_KEYS.LANGUAGE) || 'en',
    audioEnabled: safeGetStorage(STORAGE_KEYS.AUDIO_ENABLED) !== null
      ? safeGetStorage(STORAGE_KEYS.AUDIO_ENABLED) === 'true'
      : true,
    isCloudDeployment: typeof window !== 'undefined' && window.location?.hostname
      ? window.location.hostname.includes('vercel.app')
      : false,
    toolsOpen: false,
    operatorConsoleOpen: false,
  },
  engine: {
    source: (safeGetStorage(STORAGE_KEYS.ENGINE_MODE) || 'mock') === 'mock' ? 'mock-fixtures' : 'live-api',
    provider: 'gemini',
    model: 'gemini-3.1-pro',
    fastMode: safeGetStorage(STORAGE_KEYS.FAST_MODE) === 'true',
    requestStrategy: safeGetStorage(STORAGE_KEYS.FAST_MODE) === 'true' ? 'fast-deliberation' : 'full-deliberation',
    override: {
      active: false,
      temperature: 0.2,
      maxTokens: 2048,
    },
  },
  query: {
    text: '',
    preset: null,
  },
  run: {
    status: 'ready', // 'ready' | 'running' | 'complete' | 'error'
    phase: null,
    currentStep: 0,
    totalSteps: safeGetStorage(STORAGE_KEYS.FAST_MODE) === 'true' ? 1 : 7,
    requestCount: safeGetStorage(STORAGE_KEYS.FAST_MODE) === 'true' ? 1 : 7,
    estimatedCost: null,
    elapsedMs: null,
    demoMode: (safeGetStorage(STORAGE_KEYS.ENGINE_MODE) || 'mock') === 'mock',
    operatorOverride: false,
    executionOrigin: (safeGetStorage(STORAGE_KEYS.ENGINE_MODE) || 'mock') === 'mock' ? 'mock-demo' : 'live-api',
    presentationSpeed: 1, // 0.5 (Fast) | 1.0 (Normal) | 2.0 (Cinematic / Recording)
    cinematicMode: false,
    animationPreset: null,
    actualModelCall: false,
    recordedAt: null,
  },
  deliberation: {
    result: null,
    active: false,
    activeRounds: {
      MELCHIOR: 0,
      BALTHASAR: 0,
      CASPER: 0,
    },
  },
  chat: {
    messageCount: 0,
  },
  api: {
    baseUrl: '',
    adminKey: safeGetStorage(STORAGE_KEYS.ADMIN_KEY) || '',
  },
};

export function getAdminKey() {
  return safeGetStorage(STORAGE_KEYS.ADMIN_KEY) || state.api.adminKey || '';
}

export function setAdminKey(key) {
  state.api.adminKey = key;
  if (key) {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEYS.ADMIN_KEY, key);
    state.session.access = 'operator';
    state.session.token = key;
  } else {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEYS.ADMIN_KEY);
    state.session.access = 'public';
    state.session.token = null;
  }
}

export function saveOperatorSession(token, expiresAt) {
  state.session.token = token;
  state.session.expiresAt = expiresAt;
  state.session.access = 'operator';
  state.api.adminKey = token;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.ADMIN_KEY, token);
    if (expiresAt) {
      localStorage.setItem('magi_session_expires_at', expiresAt);
    }
  }
}

export function clearOperatorSession() {
  state.session.token = null;
  state.session.expiresAt = null;
  state.session.access = 'public';
  state.api.adminKey = '';
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_KEY);
    localStorage.removeItem('magi_session_expires_at');
  }
}

export function isOperatorAuthenticated() {
  const token = safeGetStorage(STORAGE_KEYS.ADMIN_KEY) || state.api?.adminKey || '';
  if (!token) return false;
  const expiresAt = safeGetStorage('magi_session_expires_at') || state.session?.expiresAt;
  if (expiresAt) {
    const expTime = new Date(expiresAt).getTime();
    if (!isNaN(expTime) && Date.now() > expTime) {
      clearOperatorSession();
      return false;
    }
  }
  return true;
}

export function getOperatorRemainingMs() {
  const expiresAt = safeGetStorage('magi_session_expires_at') || state.session?.expiresAt;
  if (!expiresAt) return 0;
  const expTime = new Date(expiresAt).getTime();
  if (isNaN(expTime)) return 0;
  return Math.max(0, expTime - Date.now());
}

export function setApiBaseUrl(url) {
  state.api.baseUrl = url;
}

export function getApiUrl(path) {
  if (state.api.baseUrl) {
    return `${state.api.baseUrl}${path}`;
  }
  return path;
}

export function setFastMode(enabled) {
  state.engine.fastMode = !!enabled;
  state.engine.requestStrategy = enabled ? 'fast-deliberation' : 'full-deliberation';
  state.run.totalSteps = enabled ? 1 : 7;
  state.run.requestCount = enabled ? 1 : 7;
  localStorage.setItem(STORAGE_KEYS.FAST_MODE, enabled ? 'true' : 'false');
}

export function setEngineMode(engine) {
  state.query.engine = engine;
  state.engine.source = engine === 'mock' ? 'mock-fixtures' : 'live-api';
  state.run.demoMode = engine === 'mock';
  localStorage.setItem(STORAGE_KEYS.ENGINE_MODE, engine);
}

export function setRunStatus(status, currentStep = 0, phase = null) {
  state.run.status = status;
  state.run.currentStep = currentStep;
  state.run.phase = phase;
}

export function setPresentationSpeed(speed) {
  const validSpeed = Number(speed) || 1;
  state.run.presentationSpeed = validSpeed;
  return state.run.presentationSpeed;
}

export function setCinematicMode(enabled) {
  state.run.cinematicMode = !!enabled;
  if (state.run.cinematicMode) {
    document.body.classList.add('cinematic-mode');
  } else {
    document.body.classList.remove('cinematic-mode');
  }
  return state.run.cinematicMode;
}

export function setOperatorOverride(active, preset = null) {
  state.run.operatorOverride = !!active;
  state.run.animationPreset = preset;
  if (active) {
    state.run.executionOrigin = 'operator-override';
    state.run.actualModelCall = false;
  } else {
    state.run.executionOrigin = state.engine.source === 'mock-fixtures' ? 'mock-demo' : 'live-api';
  }
}

export function recordExecutionTelemetry(origin, metadata = {}) {
  state.run.executionOrigin = origin;
  state.run.operatorOverride = origin === 'operator-override';
  state.run.actualModelCall = origin === 'live-api';
  state.run.recordedAt = new Date().toISOString();
  if (metadata.preset) state.run.animationPreset = metadata.preset;
  return {
    source: origin,
    operatorOverride: state.run.operatorOverride,
    selectedModel: state.engine.model,
    actualModelCall: state.run.actualModelCall,
    animationPreset: state.run.animationPreset,
    presentationSpeed: state.run.presentationSpeed,
    cinematicMode: state.run.cinematicMode,
    recordedAt: state.run.recordedAt,
  };
}

export function getExecutionOrigin() {
  if (state.run.operatorOverride) return 'operator-override';
  if (state.engine.source === 'mock-fixtures' || state.query.engine === 'mock') return 'mock-demo';
  return 'live-api';
}

