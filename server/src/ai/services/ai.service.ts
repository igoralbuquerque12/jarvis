import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AI_BASE_PROVIDER, AI_MAX_ATTEMPTS } from '../constants/ai.constant';
import {
  AiExtractRequest,
  AiProvider,
} from '../contracts/ai-provider.contract';
import { withAiRetry } from '../utils/with-retry.util';

/**
 * Decorator over the extraction adapter picked by `AI_EXTRACTION_PROVIDER`. It
 * implements the same contract, so consumers inject `AiProvider` and never
 * notice the retry.
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

  // Every new contract method must go through `withAiRetry`.
  extract<T>(request: AiExtractRequest<T>): Promise<T> {
    return withAiRetry(
      () => this.provider.extract(request),
      request.maxAttempts ?? AI_MAX_ATTEMPTS,
      this.logger,
    );
  }
}
