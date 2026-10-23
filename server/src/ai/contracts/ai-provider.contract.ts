import type { ZodType } from 'zod';

export type AiExtractRequest<T> = {
  /** Content to extract from, already pre-processed into plain text. */
  content: string;
  /** What should be extracted and any domain rules to follow. */
  instructions: string;
  /** Expected shape of the result. The output is always validated against it. */
  schema: ZodType<T>;
};

/**
 * Contract every AI vendor adapter implements. It speaks the domain's language
 * (extract structured data), never the vendor's (messages, temperature, ...).
 * Also used as the DI token consumers inject.
 */
export abstract class AiProvider {
  /** Throws if the adapter is missing configuration (e.g. API key). */
  abstract assertConfigured(): void;

  abstract extract<T>(request: AiExtractRequest<T>): Promise<T>;
}
