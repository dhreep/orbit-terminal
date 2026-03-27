import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, hashPassword } from '../services/CryptoService';

describe('CryptoService', () => {
  describe('encrypt/decrypt roundtrip', () => {
    it('returns original plaintext after encrypt then decrypt', async () => {
      const blob = await encrypt('my-secret-api-key-12345', 'strongPassword123!');
      const result = await decrypt(blob, 'strongPassword123!');
      expect(result).toBe('my-secret-api-key-12345');
    });

    it('produces different ciphertext for same input', async () => {
      const blob1 = await encrypt('same-input', 'password');
      const blob2 = await encrypt('same-input', 'password');
      expect(blob1.ciphertext).not.toBe(blob2.ciphertext);
      expect(blob1.iv).not.toBe(blob2.iv);
      expect(blob1.salt).not.toBe(blob2.salt);
    });

    it('returns base64 strings in EncryptedBlob', async () => {
      const blob = await encrypt('test', 'pass');
      const b64 = /^[A-Za-z0-9+/=]+$/;
      expect(blob.ciphertext).toMatch(b64);
      expect(blob.iv).toMatch(b64);
      expect(blob.salt).toMatch(b64);
    });

    it('throws on decrypt with wrong password', async () => {
      const blob = await encrypt('secret', 'correctPassword');
      await expect(decrypt(blob, 'wrongPassword')).rejects.toThrow();
    });
  });

  describe('hashPassword', () => {
    it('returns hash and salt as base64 strings', async () => {
      const result = await hashPassword('myPassword');
      const b64 = /^[A-Za-z0-9+/=]+$/;
      expect(result.hash).toMatch(b64);
      expect(result.salt).toMatch(b64);
    });

    it('produces same hash with same password and salt', async () => {
      const first = await hashPassword('myPassword');
      const second = await hashPassword('myPassword', first.salt);
      expect(second.hash).toBe(first.hash);
    });

    it('produces different hashes for different passwords', async () => {
      const { salt } = await hashPassword('a');
      const h1 = await hashPassword('password1', salt);
      const h2 = await hashPassword('password2', salt);
      expect(h1.hash).not.toBe(h2.hash);
    });

    it('generates random salt when not provided', async () => {
      const r1 = await hashPassword('pass');
      const r2 = await hashPassword('pass');
      expect(r1.salt).not.toBe(r2.salt);
    });
  });
});
