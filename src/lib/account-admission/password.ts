import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

export const PASSWORD_HASH_ALGORITHM = 'scrypt-v1';
export const MIN_PASSWORD_LENGTH = 10;
export const MAX_PASSWORD_LENGTH = 200;

const SALT_BYTES = 16;
const KEY_BYTES = 64;

export function validatePasswordStrength(password: string): string | null {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Password must be at most ${MAX_PASSWORD_LENGTH} characters.`;
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must include at least one letter and one number.';
  }
  return null;
}

export async function hashPassword(password: string): Promise<string> {
  const validationError = validatePasswordStrength(password);
  if (validationError) {
    throw new Error(validationError);
  }
  const salt = randomBytes(SALT_BYTES);
  const derivedKey = (await scrypt(password.normalize('NFKC'), salt, KEY_BYTES)) as Buffer;
  return `${PASSWORD_HASH_ALGORITHM}$${salt.toString('base64url')}$${derivedKey.toString('base64url')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!password || !storedHash || password.length > MAX_PASSWORD_LENGTH) return false;
  const parts = storedHash.split('$');
  if (parts.length !== 3) return false;
  const [algorithm, encodedSalt, encodedKey] = parts;
  if (algorithm !== PASSWORD_HASH_ALGORITHM || !encodedSalt || !encodedKey) return false;

  try {
    const salt = Buffer.from(encodedSalt, 'base64url');
    const expectedKey = Buffer.from(encodedKey, 'base64url');
    if (salt.length < 8 || expectedKey.length !== KEY_BYTES) return false;
    const actualKey = (await scrypt(password.normalize('NFKC'), salt, expectedKey.length)) as Buffer;
    return timingSafeEqual(actualKey, expectedKey);
  } catch {
    return false;
  }
}
