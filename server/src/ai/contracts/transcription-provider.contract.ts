export type AiTranscribeRequest = {
  /** Raw audio bytes, as downloaded from the channel. */
  audio: Buffer;
  /** MIME type of the audio, e.g. `audio/ogg; codecs=opus` (WhatsApp voice note). */
  mimetype: string;
  /** Per-attempt timeout. Defaults to AI_TRANSCRIPTION_TIMEOUT_MS. */
  timeoutMs?: number;
  /** Total attempts including the first. Defaults to AI_MAX_ATTEMPTS. */
  maxAttempts?: number;
};

/**
 * Contract every speech-to-text adapter implements, picked by
 * `AI_TRANSCRIPTION_PROVIDER`. Kept apart from `AiProvider` and
 * `EmbeddingProvider` because it is another capability with its own vendors.
 * Also used as the DI token consumers inject.
 */
export abstract class TranscriptionProvider {
  /** Throws if the adapter is missing configuration (e.g. API key). */
  abstract assertConfigured(): void;

  /** The spoken text, trimmed. Empty when nothing intelligible was said. */
  abstract transcribe(request: AiTranscribeRequest): Promise<string>;
}
