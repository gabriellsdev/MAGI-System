// =========================================================================
// MAGI SUPERCOMPUTER // API SERVICES
// =========================================================================
import { request, requestJson } from './client.js';

export async function checkSystemHealth(adminKey) {
  const query = adminKey
    ? `?admin=${encodeURIComponent(adminKey)}&_t=${Date.now()}`
    : `?_t=${Date.now()}`;
  return requestJson(`/api/health${query}`, { cache: 'no-store' });
}

export async function authenticateOperatorKey(adminKey) {
  return requestJson('/api/auth/operator', {
    method: 'POST',
    body: { adminKey },
  });
}

export async function fetchStorageStatus() {
  return requestJson('/api/v4/storage/status');
}

export async function backupStorageFiles(targetDir) {
  return requestJson('/api/v4/storage/backup', {
    method: 'POST',
    body: { targetDir },
  });
}

export async function fetchEpistemicReputation() {
  return requestJson('/api/v4/memory/reputation');
}

export async function compareWithSingleGemini(question, language, fastMode) {
  return requestJson('/api/compare', {
    method: 'POST',
    body: { question, language, fastMode },
  });
}

export async function fetchBenchmarkReport(isMock = false) {
  return requestJson(`/api/benchmark?mock=${isMock}`);
}

export async function streamDeliberation(payload, signal) {
  return request('/api/deliberate/stream', {
    method: 'POST',
    body: payload,
    signal,
  });
}
