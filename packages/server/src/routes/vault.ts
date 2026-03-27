import { Router } from 'express';
import { getDatabase } from '../db/database.js';
import { generateSessionToken, clearSessionToken } from '../middleware/auth.js';
import type { ApiResponse, VaultInitRequest, VaultVerifyRequest, StoreKeyRequest, EncryptedKeyRecord, EncryptedBlob } from '@orbit/shared';

const router = Router();

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000;
let failedAttempts = 0;
let lockoutUntil = 0;

// ─── Initialize vault (first-time setup) ──────────────────
router.post('/init', (req, res) => {
  const { passwordHash, salt } = req.body as VaultInitRequest;
  if (!passwordHash || !salt) {
    return res.status(400).json({ success: false, error: 'passwordHash and salt are required' } satisfies ApiResponse<never>);
  }

  const db = getDatabase();
  const existing = db.prepare('SELECT id FROM vault WHERE id = 1').get();
  if (existing) {
    return res.status(409).json({ success: false, error: 'Vault already initialized' } satisfies ApiResponse<never>);
  }

  db.prepare('INSERT INTO vault (id, password_hash, salt) VALUES (1, ?, ?)').run(passwordHash, salt);
  res.json({ success: true } satisfies ApiResponse<never>);
});

// ─── Check if vault exists ────────────────────────────────
router.get('/status', (_req, res) => {
  const db = getDatabase();
  const vault = db.prepare('SELECT salt FROM vault WHERE id = 1').get() as { salt: string } | undefined;
  res.json({
    success: true,
    data: {
      initialized: !!vault,
      salt: vault?.salt || null,
    },
  } satisfies ApiResponse<{ initialized: boolean; salt: string | null }>);
});

// ─── Verify master password ──────────────────────────────
router.post('/verify', (req, res) => {
  if (Date.now() < lockoutUntil) {
    const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
    return res.status(429).json({ success: false, error: `Too many attempts. Try again in ${remaining}s` } satisfies ApiResponse<never>);
  }

  const { passwordHash } = req.body as VaultVerifyRequest;
  const db = getDatabase();
  const vault = db.prepare('SELECT password_hash FROM vault WHERE id = 1').get() as { password_hash: string } | undefined;

  if (!vault) {
    return res.status(404).json({ success: false, error: 'Vault not initialized' } satisfies ApiResponse<never>);
  }

  if (vault.password_hash !== passwordHash) {
    failedAttempts++;
    if (failedAttempts >= MAX_ATTEMPTS) {
      lockoutUntil = Date.now() + LOCKOUT_MS;
      failedAttempts = 0;
    }
    return res.status(401).json({ success: false, error: 'Invalid password' } satisfies ApiResponse<never>);
  }

  failedAttempts = 0;
  const token = generateSessionToken();
  return res.json({ success: true, data: { token } });
});

// ─── Store encrypted API key ─────────────────────────────
router.post('/keys', (req, res) => {
  const { provider, encryptedBlob } = req.body as StoreKeyRequest;
  if (!provider || !encryptedBlob?.ciphertext) {
    return res.status(400).json({ success: false, error: 'provider and encryptedBlob are required' } satisfies ApiResponse<never>);
  }

  const db = getDatabase();
  db.prepare(`
    INSERT INTO encrypted_keys (provider, ciphertext, iv, salt)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(provider) DO UPDATE SET
      ciphertext = excluded.ciphertext,
      iv = excluded.iv,
      salt = excluded.salt,
      created_at = datetime('now')
  `).run(provider, encryptedBlob.ciphertext, encryptedBlob.iv, encryptedBlob.salt);

  res.json({ success: true } satisfies ApiResponse<never>);
});

// ─── Get all encrypted keys (ciphertext only) ────────────
router.get('/keys', (_req, res) => {
  const db = getDatabase();
  const rows = db.prepare('SELECT id, provider, ciphertext, iv, salt, created_at FROM encrypted_keys').all() as Array<{
    id: number;
    provider: string;
    ciphertext: string;
    iv: string;
    salt: string;
    created_at: string;
  }>;

  const records: EncryptedKeyRecord[] = rows.map((r) => ({
    id: r.id,
    provider: r.provider as EncryptedKeyRecord['provider'],
    encryptedBlob: {
      ciphertext: r.ciphertext,
      iv: r.iv,
      salt: r.salt,
    },
    createdAt: r.created_at,
  }));

  res.json({ success: true, data: records } satisfies ApiResponse<EncryptedKeyRecord[]>);
});

// ─── Delete an API key ───────────────────────────────────
router.delete('/keys/:provider', (req, res) => {
  const db = getDatabase();
  db.prepare('DELETE FROM encrypted_keys WHERE provider = ?').run(req.params.provider);
  res.json({ success: true } satisfies ApiResponse<never>);
});

// ─── Reset Vault (Destructive) ───────────────────────────
router.post('/reset', (_req, res) => {
  const db = getDatabase();
  clearSessionToken();
  db.exec(`
    DELETE FROM vault;
    DELETE FROM encrypted_keys;
    DELETE FROM notes;
    DELETE FROM workspace;
    DELETE FROM settings;
  `);
  res.json({ success: true } satisfies ApiResponse<never>);
});

export default router;
