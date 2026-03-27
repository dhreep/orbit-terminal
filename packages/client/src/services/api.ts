/**
 * API client for communicating with the OrbitTerminal backend.
 * Single Responsibility: HTTP transport only.
 */

import type {
  ApiResponse,
  WatchlistItem,
  PriceAlert,
  AlertCondition,
  NewsArticle,
  Holding,
  Transaction,
  EarningsEvent,
  TradeJournalEntry,
  CryptoQuote,
  ForexRate,
  InsiderTransaction,
  EconomicEvent,
  SentimentData,
} from '@orbit/shared';

const BASE_URL = '/api';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
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
      request<{ token: string }>('/vault/verify', {
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

  // ─── Watchlist ──────────────────────────────────────────
  watchlist: {
    getAll: () => request<WatchlistItem[]>('/watchlist'),
    add: (ticker: string) => request('/watchlist', { method: 'POST', body: JSON.stringify({ ticker }) }),
    remove: (ticker: string) => request(`/watchlist/${ticker}`, { method: 'DELETE' }),
    reorder: (tickers: string[]) => request('/watchlist/reorder', { method: 'PUT', body: JSON.stringify({ tickers }) }),
  },

  // ─── Alerts ─────────────────────────────────────────────
  alerts: {
    getAll: () => request<PriceAlert[]>('/alerts'),
    create: (ticker: string, targetPrice: number, condition: AlertCondition) =>
      request('/alerts', { method: 'POST', body: JSON.stringify({ ticker, targetPrice, condition }) }),
    remove: (id: number) => request(`/alerts/${id}`, { method: 'DELETE' }),
  },

  // ─── News ───────────────────────────────────────────────
  news: {
    getByTicker: (ticker: string) => request<NewsArticle[]>(`/news/${ticker}`),
  },

  // ─── Portfolio ──────────────────────────────────────────
  portfolio: {
    getHoldings: () => request<Holding[]>('/portfolio/holdings'),
    addHolding: (ticker: string, shares: number, avgCost: number) =>
      request('/portfolio/holdings', { method: 'POST', body: JSON.stringify({ ticker, shares, avgCost }) }),
    removeHolding: (ticker: string) => request(`/portfolio/holdings/${ticker}`, { method: 'DELETE' }),
    getTransactions: () => request<Transaction[]>('/portfolio/transactions'),
    addTransaction: (t: Omit<Transaction, 'id'>) =>
      request('/portfolio/transactions', { method: 'POST', body: JSON.stringify(t) }),
    removeTransaction: (id: number) => request(`/portfolio/transactions/${id}`, { method: 'DELETE' }),
  },

  // ─── Earnings ───────────────────────────────────────────
  earnings: {
    upcoming: () => request<EarningsEvent[]>('/earnings'),
    byTicker: (ticker: string) => request<EarningsEvent[]>(`/earnings/${ticker}`),
  },

  // ─── Journal ────────────────────────────────────────────
  journal: {
    getAll: () => request<TradeJournalEntry[]>('/journal'),
    create: (entry: { ticker: string; entryPrice: number; entryDate: string; shares: number; thesis: string }) =>
      request('/journal', { method: 'POST', body: JSON.stringify(entry) }),
    close: (id: number, data: { exitPrice: number; exitDate: string; outcome: string }) =>
      request(`/journal/${id}/close`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: number) => request(`/journal/${id}`, { method: 'DELETE' }),
  },

  // ─── Crypto ─────────────────────────────────────────────
  crypto: {
    top: (limit = 50) => request<CryptoQuote[]>(`/crypto`),
    getAll: () => request<CryptoQuote[]>('/crypto'),
    getChart: (id: string, days: number) =>
      request<Array<{ time: string; price: number }>>(`/crypto/${id}/chart?days=${days}`),
  },

  // ─── Forex ──────────────────────────────────────────────
  forex: {
    rates: (base = 'USD') => request<ForexRate[]>(`/forex/latest?base=${base}`),
    getLatest: (base: string) => request<ForexRate[]>(`/forex/latest?base=${base}`),
    getHistory: (base: string, quote: string, days: number) =>
      request<import('@orbit/shared').CandleData[]>(`/forex/history?base=${base}&quote=${quote}&days=${days}`),
  },

  // ─── Insider Trading ────────────────────────────────────
  insider: {
    byTicker: (ticker: string) => request<InsiderTransaction[]>(`/insider/${ticker}`),
    getByTicker: (ticker: string) => request<InsiderTransaction[]>(`/insider/${ticker}`),
  },

  // ─── Economic Calendar ──────────────────────────────────
  economic: {
    events: () => request<EconomicEvent[]>('/economic'),
    getAll: () => request<EconomicEvent[]>('/economic'),
  },

  // ─── Sentiment ──────────────────────────────────────────
  sentiment: {
    trending: () => request<SentimentData[]>('/sentiment'),
    getAll: () => request<SentimentData[]>('/sentiment'),
    getByTicker: (ticker: string) => request<SentimentData>(`/sentiment/${ticker}`),
  },
};
