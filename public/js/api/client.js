// =========================================================================
// MAGI SUPERCOMPUTER // HTTP CLIENT
// =========================================================================
import { getApiUrl, getAdminKey } from '../core/state.js';

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function request(path, options = {}) {
  const url = getApiUrl(path);
  const headers = { ...options.headers };

  const adminKey = getAdminKey();
  if (adminKey && !headers['x-admin-key'] && !headers['X-Admin-Key']) {
    headers['x-admin-key'] = adminKey;
  }

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}

export async function requestJson(path, options = {}) {
  const response = await request(path, options);
  
  if (!response.ok) {
    let errBody = null;
    try {
      errBody = await response.json();
    } catch {
      try {
        errBody = { error: await response.text() };
      } catch {}
    }
    const msg = errBody?.error || `HTTP ${response.status}: ${response.statusText}`;
    throw new ApiError(msg, response.status, errBody);
  }

  return response.json();
}
