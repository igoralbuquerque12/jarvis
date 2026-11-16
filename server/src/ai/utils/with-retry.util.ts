import type { Logger } from '@nestjs/common';
import { AI_RETRY_BASE_MS } from '../constants/ai.constant';
import { AiProviderError } from '../errors/ai-provider.error';

/**
 * Runs `operation`, retrying only `AiProviderError`s flagged `retryable`, with
 * exponential backoff + jitter (or the provider's Retry-After when longer).
 * Shared by every AI decorator so extraction and embeddings retry alike.
 */
export async function withAiRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number,
  logger: Logger,
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (
        !(error instanceof AiProviderError) ||
        !error.retryable ||
        attempt >= maxAttempts
      ) {
        throw error;
      }

      const backoff = AI_RETRY_BASE_MS * 2 ** (attempt - 1);
      const jitter = Math.random() * backoff * 0.2;
      const delay = Math.max(error.retryAfterMs ?? 0, backoff + jitter);

      logger.warn(
        `Attempt ${attempt}/${maxAttempts} failed (${error.message}); retrying in ${Math.round(delay)}ms.`,
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
