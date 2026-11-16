export type AiEmbedRequest = {
  /** Texts to embed, already normalised. One vector is returned per text. */
  texts: string[];
  /** Per-attempt timeout. Defaults to AI_TIMEOUT_MS. */
  timeoutMs?: number;
  /** Total attempts including the first. Defaults to AI_MAX_ATTEMPTS. */
  maxAttempts?: number;
};

/**
 * Contract every embeddings adapter implements, picked by
 * `AI_EMBEDDING_PROVIDER`. Kept apart from `AiProvider` (extraction) because
 * it is another capability with other vendors: Groq, for instance, has no
 * embeddings API. Also used as the DI token consumers inject.
 */
export abstract class EmbeddingProvider {
  /**
   * Identifier of the model behind the vectors (stored next to each vector):
   * vectors of different models are not comparable.
   */
  abstract readonly model: string;

  /** Throws if the adapter is missing configuration (e.g. API key). */
  abstract assertConfigured(): void;

  /** One vector of `AI_EMBEDDING_DIMENSIONS` numbers per text, in order. */
  abstract embed(request: AiEmbedRequest): Promise<number[][]>;
}
