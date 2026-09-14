import { createHash, randomBytes } from 'node:crypto';

/** Every key starts with this prefix so it is easy to spot in logs and configs. */
export const API_KEY_PREFIX = 'jrv_';

/** How many characters of the key are kept in clear text for display purposes. */
const VISIBLE_PREFIX_LENGTH = API_KEY_PREFIX.length + 8;

export interface GeneratedApiKey {
  /** Full secret. Shown to the user exactly once and never stored. */
  secret: string;
  /** Short, non-secret hint stored and shown in the UI (e.g. `jrv_a1b2c3d4`). */
  prefix: string;
  /** SHA-256 of the secret. This is what the database keeps. */
  hash: string;
}

export function hashApiKey(secret: string): string {
  return createHash('sha256').update(secret, 'utf8').digest('hex');
}

export function generateApiKey(): GeneratedApiKey {
  const secret = `${API_KEY_PREFIX}${randomBytes(24).toString('base64url')}`;

  return {
    secret,
    prefix: secret.slice(0, VISIBLE_PREFIX_LENGTH),
    hash: hashApiKey(secret),
  };
}

export function looksLikeApiKey(value: string): boolean {
  return (
    value.startsWith(API_KEY_PREFIX) && value.length > VISIBLE_PREFIX_LENGTH
  );
}
