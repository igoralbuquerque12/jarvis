import { Injectable } from '@nestjs/common';

import { TranscriptionProvider } from '../../ai/contracts/transcription-provider.contract';
import {
  ASSISTANT_AUDIO_MAX_BYTES,
  ASSISTANT_AUDIO_MAX_SECONDS,
  ASSISTANT_AUDIO_TOO_LONG_REPLY,
  ASSISTANT_AUDIO_UNREADABLE_REPLY,
} from '../constants/assistant-message.constant';
import type { IncomingAudio } from '../dto/receive-message.dto';
import { AssistantAudioError } from '../errors/assistant-audio.error';

/**
 * Turns an inbound WhatsApp audio into the text the assistant reads. Every
 * failure leaves as `AssistantAudioError`, carrying what to tell the user.
 */
@Injectable()
export class AssistantAudioService {
  constructor(private readonly transcriptionProvider: TranscriptionProvider) {}

  async transcribe(audio: IncomingAudio): Promise<string> {
    if (audio.seconds > ASSISTANT_AUDIO_MAX_SECONDS) {
      throw new AssistantAudioError(
        `Audio too long: ${audio.seconds}s (max ${ASSISTANT_AUDIO_MAX_SECONDS}s).`,
        ASSISTANT_AUDIO_TOO_LONG_REPLY,
      );
    }

    let text: string;

    try {
      const data = await audio.download();

      if (data.length > ASSISTANT_AUDIO_MAX_BYTES) {
        throw new AssistantAudioError(
          `Audio too large: ${data.length} bytes (max ${ASSISTANT_AUDIO_MAX_BYTES}).`,
          ASSISTANT_AUDIO_TOO_LONG_REPLY,
        );
      }

      text = await this.transcriptionProvider.transcribe({
        audio: data,
        mimetype: audio.mimetype,
      });
    } catch (error) {
      if (error instanceof AssistantAudioError) {
        throw error;
      }

      const reason = error instanceof Error ? error.message : String(error);
      throw new AssistantAudioError(
        `Audio transcription failed: ${reason}`,
        ASSISTANT_AUDIO_UNREADABLE_REPLY,
        { cause: error },
      );
    }

    if (!text) {
      throw new AssistantAudioError(
        'Audio transcription came back empty.',
        ASSISTANT_AUDIO_UNREADABLE_REPLY,
      );
    }

    return text;
  }
}
