import {
  API_KEY_PREFIX,
  generateApiKey,
  hashApiKey,
  looksLikeApiKey,
} from '../utils/generate-api-key';

describe('generateApiKey', () => {
  it('produces a prefixed secret with a matching hash and display prefix', () => {
    const key = generateApiKey();

    expect(key.secret.startsWith(API_KEY_PREFIX)).toBe(true);
    expect(key.prefix).toBe(key.secret.slice(0, API_KEY_PREFIX.length + 8));
    expect(key.hash).toBe(hashApiKey(key.secret));
    expect(key.hash).toHaveLength(64);
  });

  it('never repeats secrets', () => {
    const secrets = new Set(
      Array.from({ length: 50 }, () => generateApiKey().secret),
    );

    expect(secrets.size).toBe(50);
  });
});

describe('looksLikeApiKey', () => {
  it('accepts generated keys', () => {
    expect(looksLikeApiKey(generateApiKey().secret)).toBe(true);
  });

  it('rejects values without the prefix or too short', () => {
    expect(looksLikeApiKey('abc')).toBe(false);
    expect(looksLikeApiKey('jrv_')).toBe(false);
    expect(looksLikeApiKey('Bearer jrv_x')).toBe(false);
  });
});
