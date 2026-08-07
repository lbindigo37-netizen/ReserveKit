import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

const KEY_LENGTH = 64;
const SALT_BYTES = 16;
const SESSION_TOKEN_BYTES = 32;
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const SESSION_COOKIE_NAME = "reservekit_session";

/**
 * Hash a plaintext password using scrypt (Node's built-in, no native
 * dependency required). Stored as `salt:derivedKey`, both hex-encoded.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

/**
 * Verify a plaintext password against a stored `salt:derivedKey` hash using
 * a constant-time comparison to avoid timing side-channels.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, keyHex] = storedHash.split(":");
  if (!saltHex || !keyHex) return false;

  const salt = Buffer.from(saltHex, "hex");
  const expectedKey = Buffer.from(keyHex, "hex");
  const derivedKey = (await scrypt(password, salt, expectedKey.length)) as Buffer;

  if (derivedKey.length !== expectedKey.length) return false;
  return timingSafeEqual(derivedKey, expectedKey);
}

/**
 * Generate a new opaque session token. Returns both the raw token (sent to
 * the client as a cookie value) and its SHA-256 hash (stored in the
 * database). This means a leaked database row can never be replayed as a
 * session cookie.
 */
export function createSessionToken(): { token: string; tokenHash: string } {
  const token = randomBytes(SESSION_TOKEN_BYTES).toString("base64url");
  return { token, tokenHash: hashSessionToken(token) };
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
