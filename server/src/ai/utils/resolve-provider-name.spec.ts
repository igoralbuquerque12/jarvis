import type { ConfigService } from '@nestjs/config';
import {
  assertNoLegacyProviderEnv,
  resolveProviderName,
} from './resolve-provider-name';

const config = (env: Record<string, string>) =>
  ({ get: (key: string) => env[key] }) as unknown as ConfigService;

describe('resolveProviderName', () => {
  const allowed = ['openai', 'groq'] as const;

  it('reads the env var', () => {
    expect(
      resolveProviderName(
        config({ AI_EXTRACTION_PROVIDER: 'groq' }),
        'AI_EXTRACTION_PROVIDER',
        allowed,
        'openai',
      ),
    ).toBe('groq');
  });

  it('falls back to the default when unset or blank', () => {
    expect(
      resolveProviderName(
        config({}),
        'AI_EXTRACTION_PROVIDER',
        allowed,
        'openai',
      ),
    ).toBe('openai');
    expect(
      resolveProviderName(
        config({ AI_EXTRACTION_PROVIDER: '  ' }),
        'AI_EXTRACTION_PROVIDER',
        allowed,
        'openai',
      ),
    ).toBe('openai');
  });

  it('fails the boot on an unknown provider, naming the variable', () => {
    expect(() =>
      resolveProviderName(
        config({ AI_EMBEDDING_PROVIDER: 'groq' }),
        'AI_EMBEDDING_PROVIDER',
        ['openai'] as const,
        'openai',
      ),
    ).toThrow('AI_EMBEDDING_PROVIDER must be one of: openai (got "groq").');
  });
});

describe('assertNoLegacyProviderEnv', () => {
  it('refuses the old AI_PROVIDER when the new name is missing', () => {
    expect(() =>
      assertNoLegacyProviderEnv(config({ AI_PROVIDER: 'groq' })),
    ).toThrow('AI_PROVIDER was renamed to AI_EXTRACTION_PROVIDER');
  });

  it('accepts the new name (even with a leftover old one)', () => {
    expect(() =>
      assertNoLegacyProviderEnv(
        config({ AI_PROVIDER: 'groq', AI_EXTRACTION_PROVIDER: 'groq' }),
      ),
    ).not.toThrow();
    expect(() => assertNoLegacyProviderEnv(config({}))).not.toThrow();
  });
});
