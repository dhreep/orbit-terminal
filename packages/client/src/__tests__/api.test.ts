import { describe, it, expect, vi, beforeEach } from 'vitest';

let setAuthToken: typeof import('../services/api').setAuthToken;
let api: typeof import('../services/api').api;

const mockFetch = vi.fn();

beforeEach(async () => {
  vi.resetModules();
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
  const mod = await import('../services/api');
  setAuthToken = mod.setAuthToken;
  api = mod.api;
});

function mockSuccess(data: unknown = {}) {
  mockFetch.mockResolvedValueOnce({
    json: () => Promise.resolve({ success: true, data }),
  });
}

function mockFailure(error: string) {
  mockFetch.mockResolvedValueOnce({
    json: () => Promise.resolve({ success: false, error }),
    status: 400,
  });
}

describe('api', () => {
  it('includes Authorization header when token is set', async () => {
    mockSuccess({ initialized: false, salt: null });
    setAuthToken('test-token-123');
    await api.vault.getStatus();
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/vault/status',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token-123',
        }),
      }),
    );
  });

  it('omits Authorization header when token is null', async () => {
    mockSuccess({ initialized: false, salt: null });
    setAuthToken(null);
    await api.vault.getStatus();
    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers).not.toHaveProperty('Authorization');
  });

  it('prepends /api to endpoint', async () => {
    mockSuccess([]);
    await api.vault.getKeys();
    expect(mockFetch.mock.calls[0][0]).toBe('/api/vault/keys');
  });

  it('returns data on success', async () => {
    const data = { initialized: true, salt: 'abc' };
    mockSuccess(data);
    const result = await api.vault.getStatus();
    expect(result).toEqual(data);
  });

  it('throws on failure response', async () => {
    mockFailure('Unauthorized');
    await expect(api.vault.getStatus()).rejects.toThrow('Unauthorized');
  });

  it('sends POST with JSON body for mutations', async () => {
    mockSuccess({});
    await api.vault.init('hash123', 'salt456');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/vault/init',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ passwordHash: 'hash123', salt: 'salt456' }),
      }),
    );
  });
});
