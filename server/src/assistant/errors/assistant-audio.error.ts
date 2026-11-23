/**
 * An inbound audio that could not be turned into text. `userMessage` is what
 * the user reads on WhatsApp (pt-BR); `message` is the diagnostic reason
 * stored on the failed run.
 */
export class AssistantAudioError extends Error {
  constructor(
    message: string,
    readonly userMessage: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'AssistantAudioError';
  }
}
