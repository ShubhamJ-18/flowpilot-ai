import crypto from 'crypto';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Derive 32-byte key from ENCRYPTION_KEY
const KEY_BUFFER = crypto.createHash('sha256').update(String(env.ENCRYPTION_KEY)).digest();

/**
 * Encrypts arbitrary text or JSON using AES-256-GCM.
 * Format: iv:authTag:ciphertext (hex encoded)
 */
export function encryptCredential(plainText) {
  if (typeof plainText === 'object') {
    plainText = JSON.stringify(plainText);
  }
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY_BUFFER, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM ciphertext payload.
 */
export function decryptCredential(cipherPayload) {
  if (!cipherPayload || typeof cipherPayload !== 'string') return null;

  const parts = cipherPayload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted credential payload format');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY_BUFFER, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  try {
    return JSON.parse(decrypted);
  } catch {
    return decrypted;
  }
}

/**
 * Creates a cryptographically random session token (64 hex chars).
 */
export function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Computes a SHA-256 hash of a session token for secure database storage.
 */
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
