import { Request, Response, NextFunction } from 'express';

let sessionToken: string | null = null;

export function generateSessionToken(): string {
  sessionToken = crypto.randomUUID();
  return sessionToken;
}

export function clearSessionToken(): void {
  sessionToken = null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ') || header.slice(7) !== sessionToken) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }
  next();
}
