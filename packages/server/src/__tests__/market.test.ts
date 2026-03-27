import { describe, it, expect, beforeEach } from 'vitest';
import { setApiKey, clearApiKeys, getApiKey } from '../routes/market.js';

describe('market API key management', () => {
  beforeEach(() => {
    clearApiKeys();
  });

  it('setApiKey stores and getApiKey retrieves a key', () => {
    setApiKey('alpha_vantage', 'test-key-123');
    expect(getApiKey('alpha_vantage')).toBe('test-key-123');
  });

  it('supports multiple providers', () => {
    setApiKey('alpha_vantage', 'av-key');
    setApiKey('fmp', 'fmp-key');
    expect(getApiKey('alpha_vantage')).toBe('av-key');
    expect(getApiKey('fmp')).toBe('fmp-key');
  });

  it('clearApiKeys clears all keys', () => {
    setApiKey('alpha_vantage', 'av-key');
    setApiKey('fmp', 'fmp-key');
    clearApiKeys();
    expect(getApiKey('alpha_vantage')).toBeUndefined();
    expect(getApiKey('fmp')).toBeUndefined();
  });

  it('getApiKey returns undefined for unknown provider', () => {
    expect(getApiKey('nonexistent')).toBeUndefined();
  });

  it('setApiKey overwrites existing key', () => {
    setApiKey('fmp', 'old-key');
    setApiKey('fmp', 'new-key');
    expect(getApiKey('fmp')).toBe('new-key');
  });
});

describe('ticker validation', () => {
  // Mirrors the TICKER_REGEX from market.ts: /^[A-Z0-9.\-]{1,10}$/
  const TICKER_REGEX = /^[A-Z0-9.\-]{1,10}$/;

  it.each([
    ['AAPL', true],
    ['BRK.B', true],
    ['BF-B', true],
    ['A', true],
    ['X', true],
    ['SPY', true],
    ['', false],
    ['aapl', false],
    ['TOOLONGTICKER1', false],
    ['<script>', false],
    ['../../etc', false],
    ['AAPL MSFT', false],
    ['AAPL\n', false],
    ['$AAPL', false],
  ])('validates "%s" as %s', (ticker, expected) => {
    expect(TICKER_REGEX.test(ticker)).toBe(expected);
  });
});
