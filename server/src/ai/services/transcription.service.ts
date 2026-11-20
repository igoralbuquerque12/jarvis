import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  AI_BASE_TRANSCRIPTION_PROVIDER,
  AI_MAX_ATTEMPTS,
} from '../constants/ai.constant';
import {
  AiTranscribeRequest,
  TranscriptionProvider,
} from '../contracts/transcription-provider.contract';
import { withAiRetry } from '../utils/with-retry.util';

/**
 * Decorator over the speech-to-text adapter picked by
 * `AI_TRANSCRIPTION_PROVIDER`, retrying like `AiService`.
 */
@Injectable()
export class TranscriptionService
  implements TranscriptionProvider, OnModuleInit
{
  private readonly logger = new Logger(TranscriptionService.name);

  constructor(
    @Inject(AI_BASE_TRANSCRIPTION_PROVIDER)
    private readonly provider: TranscriptionProvider,
  ) {}

  onModuleInit() {
    this.assertConfigured();
  }

  assertConfigured() {
    this.provider.assertConfigured();
  }

  transcribe(request: AiTranscribeRequest): Promise<string> {
    return withAiRetry(
      () => this.provider.transcribe(request),
      request.maxAttempts ?? AI_MAX_ATTEMPTS,
      this.logger,
    );
  }
}
