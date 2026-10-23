import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  AI_BASE_PROVIDER,
  AI_MAX_ATTEMPTS,
  AI_RETRY_BASE_MS,
} from '../constants/ai.constant';
import {
  AiExtractRequest,
  AiProvider,
} from '../contracts/ai-provider.contract';
import { AiProviderError } from '../errors/ai-provider.error';

/**
 * Decorator over the vendor adapter picked by `AI_PROVIDER`. It implements the
 * same contract, so consumers inject `AiProvider` and never notice the retry.
 */
@Injectable()
export class AiService implements AiProvider, OnModuleInit {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @Inject(AI_BASE_PROVIDER) private readonly provider: AiProvider,
  ) {}

  onModuleInit() {
    this.assertConfigured();
  }

  assertConfigured() {
    this.provider.assertConfigured();
  }

  extract<T>(request: AiExtractRequest<T>): Promise<T> {
    return this.withRetry(() => this.provider.extract(request));
  }

  // Every new contract method must go through the same wrapper.
  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    for (let attempt = 1; ; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (
          !(error instanceof AiProviderError) ||
          !error.retryable ||
          attempt >= AI_MAX_ATTEMPTS
        ) {
          throw error;
        }

        const backoff = AI_RETRY_BASE_MS * 2 ** (attempt - 1);
        const jitter = Math.random() * backoff * 0.2;
        const delay = Math.max(error.retryAfterMs ?? 0, backoff + jitter);

        this.logger.warn(
          `Attempt ${attempt}/${AI_MAX_ATTEMPTS} failed (${error.message}); retrying in ${Math.round(delay)}ms.`,
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
}
