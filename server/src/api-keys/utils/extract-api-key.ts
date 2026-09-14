import type { IncomingHttpHeaders } from 'node:http';

/**
 * Reads the API key sent by the client.
 * Accepted forms: `Authorization: Bearer <key>` or `x-api-key: <key>`.
 */
export function extractApiKey(headers: IncomingHttpHeaders): string | null {
  const authorization = headers['authorization'];

  if (typeof authorization === 'string') {
    const trimmed = authorization.trim();

    if (trimmed.toLowerCase().startsWith('bearer ')) {
      const key = trimmed.slice('bearer '.length).trim();
      return key.length > 0 ? key : null;
    }
  }

  const custom = headers['x-api-key'];

  if (typeof custom === 'string' && custom.trim().length > 0) {
    return custom.trim();
  }

  return null;
}
