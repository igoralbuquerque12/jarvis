import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AI_EMBEDDING_DIMENSIONS,
  AI_TIMEOUT_MS,
} from '../ai/constants/ai.constant';
import {
  AiEmbedRequest,
  EmbeddingProvider,
} from '../ai/contracts/embedding-provider.contract';
import { requestEmbeddings } from '../ai/utils/embeddings.util';
import { OPENAI_BASE_URL, OPENAI_EMBEDDING_MODEL } from './openai.constant';

@Injectable()
export class OpenaiEmbeddingProvider implements EmbeddingProvider {
  readonly model = OPENAI_EMBEDDING_MODEL;

  constructor(private readonly configService: ConfigService) {}

  assertConfigured() {
    this.apiKey();
  }

  async embed({ texts, timeoutMs }: AiEmbedRequest): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    return requestEmbeddings({
      provider: 'openai',
      baseUrl: OPENAI_BASE_URL,
      apiKey: this.apiKey(),
      timeoutMs: timeoutMs ?? AI_TIMEOUT_MS,
      model: OPENAI_EMBEDDING_MODEL,
      dimensions: AI_EMBEDDING_DIMENSIONS,
      input: texts,
    });
  }

  private apiKey(): string {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY environment variable is required (knowledge base embeddings).',
      );
    }

    return apiKey;
  }
}
