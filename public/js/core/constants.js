// =========================================================================
// MAGI SUPERCOMPUTER // CORE CONSTANTS
// =========================================================================

export const ALL_ENGINE_OPTIONS = [
  { value: 'mock', text: 'MOCK FIXTURES' },
  { value: 'gemini', text: 'GEMINI 3.1 PRO' },
  { value: 'gemini-flash', text: 'GEMINI 2.5 FLASH' },
  { value: 'groq-free', text: 'PRODUCTION CORE' },
  { value: 'ollama-balanced', text: 'OLLAMA LOCAL (BALANCED 7B/8B)' },
  { value: 'ollama-light', text: 'OLLAMA LOCAL (LIGHT 3B)' },
];

export const STORAGE_KEYS = {
  LANGUAGE: 'magi_language',
  ENGINE_MODE: 'magi_engine_mode',
  FAST_MODE: 'magi_fast_mode',
  AUDIO_ENABLED: 'magi_audio_enabled',
  ADMIN_KEY: 'magi_admin_key',
  VIEW_MODE: 'magi_view_mode',
};
