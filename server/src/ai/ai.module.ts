import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GroqTranscriptionProvider } from '../groq/groq-transcription.provider';
import { GroqModule } from '../groq/groq.module';
import { GroqProvider } from '../groq/groq.provider';
import { OpenaiEmbeddingProvider } from '../openai/openai-embedding.provider';
import { OpenaiModule } from '../openai/openai.module';
import { OpenaiProvider } from '../openai/openai.provider';
import {
  AI_BASE_EMBEDDING_PROVIDER,
  AI_BASE_PROVIDER,
  AI_BASE_TRANSCRIPTION_PROVIDER,
  AI_DEFAULT_EMBEDDING_PROVIDER,
  AI_DEFAULT_EXTRACTION_PROVIDER,
  AI_DEFAULT_TRANSCRIPTION_PROVIDER,
  AI_EMBEDDING_PROVIDER_ENV,
  AI_EMBEDDING_PROVIDER_NAMES,
  AI_EXTRACTION_PROVIDER_ENV,
  AI_EXTRACTION_PROVIDER_NAMES,
  AI_TRANSCRIPTION_PROVIDER_ENV,
  AI_TRANSCRIPTION_PROVIDER_NAMES,
} from './constants/ai.constant';
import { AiProvider } from './contracts/ai-provider.contract';
import { EmbeddingProvider } from './contracts/embedding-provider.contract';
import { TranscriptionProvider } from './contracts/transcription-provider.contract';
import { AiService } from './services/ai.service';
import { EmbeddingService } from './services/embedding.service';
import { TranscriptionService } from './services/transcription.service';
import {
  assertNoLegacyProviderEnv,
  resolveProviderName,
} from './utils/resolve-provider-name';

/**
 * Three independent capabilities, each with its own env var:
 * - `AI_EXTRACTION_PROVIDER` (openai | groq) → `AiProvider` (structured extraction);
 * - `AI_EMBEDDING_PROVIDER` (openai) → `EmbeddingProvider` (RAG vectors);
 * - `AI_TRANSCRIPTION_PROVIDER` (groq) → `TranscriptionProvider` (speech-to-text).
 */
@Module({
  imports: [OpenaiModule, GroqModule],
  providers: [
    {
      provide: AI_BASE_PROVIDER,
      inject: [ConfigService, OpenaiProvider, GroqProvider],
      useFactory: (
        configService: ConfigService,
        openai: OpenaiProvider,
        groq: GroqProvider,
      ): AiProvider => {
        assertNoLegacyProviderEnv(configService);

        const name = resolveProviderName(
          configService,
          AI_EXTRACTION_PROVIDER_ENV,
          AI_EXTRACTION_PROVIDER_NAMES,
          AI_DEFAULT_EXTRACTION_PROVIDER,
        );

        return { openai, groq }[name];
      },
    },
    {
      provide: AI_BASE_EMBEDDING_PROVIDER,
      inject: [ConfigService, OpenaiEmbeddingProvider],
      useFactory: (
        configService: ConfigService,
        openai: OpenaiEmbeddingProvider,
      ): EmbeddingProvider => {
        const name = resolveProviderName(
          configService,
          AI_EMBEDDING_PROVIDER_ENV,
          AI_EMBEDDING_PROVIDER_NAMES,
          AI_DEFAULT_EMBEDDING_PROVIDER,
        );

        return { openai }[name];
      },
    },
    {
      provide: AI_BASE_TRANSCRIPTION_PROVIDER,
      inject: [ConfigService, GroqTranscriptionProvider],
      useFactory: (
        configService: ConfigService,
        groq: GroqTranscriptionProvider,
      ): TranscriptionProvider => {
        const name = resolveProviderName(
          configService,
          AI_TRANSCRIPTION_PROVIDER_ENV,
          AI_TRANSCRIPTION_PROVIDER_NAMES,
          AI_DEFAULT_TRANSCRIPTION_PROVIDER,
        );

        return { groq }[name];
      },
    },
    AiService,
    EmbeddingService,
    TranscriptionService,
    { provide: AiProvider, useExisting: AiService },
    { provide: EmbeddingProvider, useExisting: EmbeddingService },
    { provide: TranscriptionProvider, useExisting: TranscriptionService },
  ],
  exports: [AiProvider, EmbeddingProvider, TranscriptionProvider],
})
export class AiModule {}
