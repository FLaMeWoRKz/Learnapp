import crypto from 'crypto';

const TOKEN_BYTES = 32;
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export function generateSecureToken() {
  return crypto.randomBytes(TOKEN_BYTES).toString('hex');
}

export function getTokenExpiry() {
  return Date.now() + TOKEN_EXPIRY_MS;
}

export function isTokenExpired(expiresAt) {
  if (expiresAt == null) return true;
  return Date.now() > expiresAt;
}
