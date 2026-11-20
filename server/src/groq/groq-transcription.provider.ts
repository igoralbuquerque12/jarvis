import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AI_TRANSCRIPTION_LANGUAGE,
  AI_TRANSCRIPTION_TIMEOUT_MS,
} from '../ai/constants/ai.constant';
import {
  AiTranscribeRequest,
  TranscriptionProvider,
} from '../ai/contracts/transcription-provider.contract';
import { requestTranscription } from '../ai/utils/transcriptions.util';
import { GROQ_BASE_URL, GROQ_TRANSCRIPTION_MODEL } from './groq.constant';

/** Speech-to-text over Groq's hosted Whisper. */
@Injectable()
export class GroqTranscriptionProvider implements TranscriptionProvider {
  constructor(private readonly configService: ConfigService) {}

  assertConfigured() {
    this.apiKey();
  }

  transcribe({
    audio,
    mimetype,
    timeoutMs,
  }: AiTranscribeRequest): Promise<string> {
    return requestTranscription({
      provider: 'groq',
      baseUrl: GROQ_BASE_URL,
      apiKey: this.apiKey(),
      timeoutMs: timeoutMs ?? AI_TRANSCRIPTION_TIMEOUT_MS,
      model: GROQ_TRANSCRIPTION_MODEL,
      language: AI_TRANSCRIPTION_LANGUAGE,
      audio,
      mimetype,
    });
  }

  private apiKey(): string {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');

    if (!apiKey) {
      throw new Error(
        'GROQ_API_KEY environment variable is required (audio transcription).',
      );
    }

    return apiKey;
  }
}
