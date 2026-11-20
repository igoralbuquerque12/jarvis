/** WhatsApp caps a text message at 65 536 chars; keep assistant bubbles sane. */
export const ASSISTANT_MESSAGE_MAX_LENGTH = 4096;

/**
 * Sent by the backend when a run ends (or fails) and the assistant never
 * called `enviar_mensagem`, so the user is not left without an answer.
 */
export const ASSISTANT_FALLBACK_REPLY =
  'Tive um problema aqui e não consegui te responder agora.';

/** Longest audio sent to the speech-to-text model. */
export const ASSISTANT_AUDIO_MAX_SECONDS = 600;
/** Upload limit of the speech-to-text API (Groq: 25 MB), with some margin. */
export const ASSISTANT_AUDIO_MAX_BYTES = 24 * 1024 * 1024;

export const ASSISTANT_AUDIO_TOO_LONG_REPLY =
  'Esse áudio é longo demais pra eu ouvir (o limite é de 10 minutos). Pode mandar um mais curto ou escrever?';
export const ASSISTANT_AUDIO_UNREADABLE_REPLY =
  'Não consegui ouvir esse áudio. Pode mandar de novo ou escrever?';
