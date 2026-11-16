import { Module } from '@nestjs/common';
import { OpenaiEmbeddingProvider } from './openai-embedding.provider';
import { OpenaiProvider } from './openai.provider';

@Module({
  providers: [OpenaiProvider, OpenaiEmbeddingProvider],
  exports: [OpenaiProvider, OpenaiEmbeddingProvider],
})
export class OpenaiModule {}
