import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const SALT_BYTES = 16;

/**
 * Minimal standalone copy of the API server's password hashing (same
 * scrypt scheme, same "salt:derivedKey" format) so the seed script can
 * create demo login accounts without the `db` package depending on the
 * `api-server` package.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}
