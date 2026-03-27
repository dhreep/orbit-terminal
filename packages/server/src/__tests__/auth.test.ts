import { describe, it, expect, vi, beforeEach } from 'vitest';

function mockRes() {
  const res: Record<string, ReturnType<typeof vi.fn>> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('auth middleware', () => {
  let generateSessionToken: typeof import('../middleware/auth.js').generateSessionToken;
  let clearSessionToken: typeof import('../middleware/auth.js').clearSessionToken;
  let requireAuth: typeof import('../middleware/auth.js').requireAuth;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../middleware/auth.js');
    generateSessionToken = mod.generateSessionToken;
    clearSessionToken = mod.clearSessionToken;
    requireAuth = mod.requireAuth;
  });

  describe('generateSessionToken', () => {
    it('returns a UUID string', () => {
      const token = generateSessionToken();
      expect(token).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      );
    });

    it('returns a different token on each call', () => {
      const t1 = generateSessionToken();
      const t2 = generateSessionToken();
      expect(t1).not.toBe(t2);
    });
  });

  describe('clearSessionToken', () => {
    it('causes requireAuth to reject after clearing', () => {
      const token = generateSessionToken();
      clearSessionToken();

      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = mockRes();
      const next = vi.fn();

      requireAuth(req as never, res as never, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('requireAuth', () => {
    it('calls next() with valid Bearer token', () => {
      const token = generateSessionToken();
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = mockRes();
      const next = vi.fn();

      requireAuth(req as never, res as never, next);

      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 401 when no Authorization header', () => {
      generateSessionToken();
      const req = { headers: {} };
      const res = mockRes();
      const next = vi.fn();

      requireAuth(req as never, res as never, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
      });
    });

    it('returns 401 when header does not start with Bearer', () => {
      const token = generateSessionToken();
      const req = { headers: { authorization: `Basic ${token}` } };
      const res = mockRes();
      const next = vi.fn();

      requireAuth(req as never, res as never, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 401 when token is wrong', () => {
      generateSessionToken();
      const req = { headers: { authorization: 'Bearer wrong-token' } };
      const res = mockRes();
      const next = vi.fn();

      requireAuth(req as never, res as never, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 401 when no token has been generated', () => {
      const req = { headers: { authorization: 'Bearer some-token' } };
      const res = mockRes();
      const next = vi.fn();

      requireAuth(req as never, res as never, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
