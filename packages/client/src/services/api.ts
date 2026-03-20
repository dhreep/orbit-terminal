/**
 * API client for communicating with the OrbitTerminal backend.
 * Single Responsibility: HTTP transport only.
 */

import type { ApiResponse } from '@orbit/shared';

const BASE_URL = '/api';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const json: ApiResponse<T> = await response.json();

  if (!json.success) {
    throw new Error(json.error || `Request failed: ${response.status}`);
  }

  return json.data as T;
}

export const api = {
  // ─── Vault ──────────────────────────────────────────────
  vault: {
    getStatus: () => request<{ initialized: boolean; salt: string | null }>('/vault/status'),
    init: (passwordHash: string, salt: string) =>
      request('/vault/init', {
        method: 'POST',
        body: JSON.stringify({ passwordHash, salt }),
      }),
    verify: (passwordHash: string) =>
      request('/vault/verify', {
        method: 'POST',
        body: JSON.stringify({ passwordHash }),
      }),
    getKeys: () => request<import('@orbit/shared').EncryptedKeyRecord[]>('/vault/keys'),
    storeKey: (provider: string, encryptedBlob: import('@orbit/shared').EncryptedBlob) =>
      request('/vault/keys', {
        method: 'POST',
        body: JSON.stringify({ provider, encryptedBlob }),
      }),
    deleteKey: (provider: string) =>
      request(`/vault/keys/${provider}`, { method: 'DELETE' }),
    reset: () => request('/vault/reset', { method: 'POST' }),
  },

  // ─── Notes ──────────────────────────────────────────────
  notes: {
    get: (slotId: number, ticker: string) =>
      request<import('@orbit/shared').NoteRecord | null>(`/notes/${slotId}/${ticker}`),
    getAll: () => request<import('@orbit/shared').NoteRecord[]>('/notes'),
    save: (slotId: number, ticker: string, content: string) =>
      request('/notes/', {
        method: 'PUT',
        body: JSON.stringify({ slotId, ticker, content }),
      }),
  },

  // ─── Market ─────────────────────────────────────────────
  market: {
    getCandles: (ticker: string, range: string = '3M') =>
      request<import('@orbit/shared').CandleData[]>(`/market/candles/${ticker}?range=${range}`),
    getFundamentals: (ticker: string) =>
      request<import('@orbit/shared').FundamentalRatios>(`/market/fundamentals/${ticker}`),
    search: (query: string) =>
      request<Array<{ symbol: string; name: string; exchange: string }>>(`/market/search?q=${encodeURIComponent(query)}`),
    setSessionKey: (provider: string, apiKey: string) =>
      request('/market/session/keys', {
        method: 'POST',
        body: JSON.stringify({ provider, apiKey }),
      }),
    lockSession: () => request('/market/session/lock', { method: 'POST' }),
    getRateStatus: () => request<{ availableTokens: number; queueLength: number }>('/market/rate-status'),
    getSessionCheck: () => request<{ alpha_vantage: boolean; fmp: boolean }>('/market/session/check'),
  },

  // ─── Workspace ──────────────────────────────────────────
  workspace: {
    get: () => request<import('@orbit/shared').Workspace>('/workspace'),
    save: (workspace: import('@orbit/shared').Workspace) =>
      request('/workspace', {
        method: 'PUT',
        body: JSON.stringify(workspace),
      }),
    exportAll: () => request<import('@orbit/shared').WorkspaceExport>('/workspace/export'),
    importAll: (data: import('@orbit/shared').WorkspaceExport) =>
      request('/workspace/import', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};
