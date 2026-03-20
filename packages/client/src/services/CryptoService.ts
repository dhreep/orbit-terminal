/**
 * CryptoService: Zero-Knowledge client-side encryption using Web Crypto API.
 * PBKDF2 key derivation + AES-GCM encryption.
 * No plaintext keys ever leave the browser.
 */

import type { EncryptedBlob } from '@orbit/shared';

const PBKDF2_ITERATIONS = 600_000;
const KEY_LENGTH = 256;
const SALT_BYTES = 16;
const IV_BYTES = 12;

function bufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function deriveKey(password: string, salt: ArrayBuffer): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encrypt(plaintext: string, password: string): Promise<EncryptedBlob> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(password, salt.buffer);

  const encoder = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );

  return {
    ciphertext: bufferToBase64(ciphertext),
    iv: bufferToBase64(iv.buffer),
    salt: bufferToBase64(salt.buffer),
  };
}

export async function decrypt(blob: EncryptedBlob, password: string): Promise<string> {
  const salt = base64ToBuffer(blob.salt);
  const iv = base64ToBuffer(blob.iv);
  const ciphertext = base64ToBuffer(blob.ciphertext);
  const key = await deriveKey(password, salt);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Hash a password for storage/verification.
 * Uses PBKDF2 to create a hash that can be compared server-side.
 */
export async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const saltBuffer = salt ? base64ToBuffer(salt) : crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const key = await deriveKey(password, saltBuffer instanceof Uint8Array ? saltBuffer.buffer : saltBuffer);

  // Export key to get a comparable hash
  const exported = await crypto.subtle.exportKey('raw', await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer instanceof Uint8Array ? saltBuffer.buffer : saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']),
    { name: 'AES-GCM', length: KEY_LENGTH },
    true,
    ['encrypt']
  ));

  return {
    hash: bufferToBase64(exported),
    salt: bufferToBase64(saltBuffer instanceof Uint8Array ? saltBuffer.buffer : saltBuffer),
  };
}
