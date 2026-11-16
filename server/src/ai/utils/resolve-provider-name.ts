import type { ConfigService } from '@nestjs/config';
import {
  AI_EXTRACTION_PROVIDER_ENV,
  AI_LEGACY_PROVIDER_ENV,
} from '../constants/ai.constant';

/**
 * Reads the provider env var `envName`, falling back to `fallback`, and fails
 * the boot when the value is not one of `allowed`.
 */
export function resolveProviderName<T extends string>(
  configService: ConfigService,
  envName: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const name = configService.get<string>(envName)?.trim() || fallback;

  if (!allowed.includes(name as T)) {
    throw new Error(
      `${envName} must be one of: ${allowed.join(', ')} (got "${name}").`,
    );
  }

  return name as T;
}

/**
 * `AI_PROVIDER` was renamed. Booting with only the old name would silently
 * fall back to the default provider, so it is refused with the new name.
 */
export function assertNoLegacyProviderEnv(configService: ConfigService) {
  const legacy = configService.get<string>(AI_LEGACY_PROVIDER_ENV);
  const current = configService.get<string>(AI_EXTRACTION_PROVIDER_ENV);

  if (legacy && !current) {
    throw new Error(
      `${AI_LEGACY_PROVIDER_ENV} was renamed to ${AI_EXTRACTION_PROVIDER_ENV} (extraction: openai | groq); embeddings use AI_EMBEDDING_PROVIDER (openai). Rename it in the .env.`,
    );
  }
}
