import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  AI_BASE_EMBEDDING_PROVIDER,
  AI_EMBEDDING_BATCH_SIZE,
  AI_MAX_ATTEMPTS,
} from '../constants/ai.constant';
import {
  AiEmbedRequest,
  EmbeddingProvider,
} from '../contracts/embedding-provider.contract';
import { withAiRetry } from '../utils/with-retry.util';

/**
 * Decorator over the embeddings adapter picked by `AI_EMBEDDING_PROVIDER`:
 * splits the input in batches and retries each batch like `AiService`.
 */
@Injectable()
export class EmbeddingService implements EmbeddingProvider, OnModuleInit {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(
    @Inject(AI_BASE_EMBEDDING_PROVIDER)
    private readonly provider: EmbeddingProvider,
  ) {}

  get model(): string {
    return this.provider.model;
  }

  onModuleInit() {
    this.assertConfigured();
  }

  assertConfigured() {
    this.provider.assertConfigured();
  }

  async embed(request: AiEmbedRequest): Promise<number[][]> {
    const vectors: number[][] = [];

    for (
      let start = 0;
      start < request.texts.length;
      start += AI_EMBEDDING_BATCH_SIZE
    ) {
      const texts = request.texts.slice(start, start + AI_EMBEDDING_BATCH_SIZE);
      const batch = await withAiRetry(
        () => this.provider.embed({ ...request, texts }),
        request.maxAttempts ?? AI_MAX_ATTEMPTS,
        this.logger,
      );

      vectors.push(...batch);
    }

    return vectors;
  }
}
