/** DI token for the extraction adapter picked by `AI_EXTRACTION_PROVIDER` (before retry). */
export const AI_BASE_PROVIDER = Symbol('AI_BASE_PROVIDER');
/** DI token for the embeddings adapter picked by `AI_EMBEDDING_PROVIDER` (before retry). */
export const AI_BASE_EMBEDDING_PROVIDER = Symbol('AI_BASE_EMBEDDING_PROVIDER');

/** Structured extraction (knowledge base name/description). */
export const AI_EXTRACTION_PROVIDER_ENV = 'AI_EXTRACTION_PROVIDER';
export const AI_EXTRACTION_PROVIDER_NAMES = ['openai', 'groq'] as const;
export type AiExtractionProviderName =
  (typeof AI_EXTRACTION_PROVIDER_NAMES)[number];
export const AI_DEFAULT_EXTRACTION_PROVIDER: AiExtractionProviderName =
  'openai';

/** Embeddings of the knowledge base RAG. Groq has no embeddings API. */
export const AI_EMBEDDING_PROVIDER_ENV = 'AI_EMBEDDING_PROVIDER';
export const AI_EMBEDDING_PROVIDER_NAMES = ['openai'] as const;
export type AiEmbeddingProviderName =
  (typeof AI_EMBEDDING_PROVIDER_NAMES)[number];
export const AI_DEFAULT_EMBEDDING_PROVIDER: AiEmbeddingProviderName = 'openai';

/** Old single variable, replaced by the two above. Refused on boot. */
export const AI_LEGACY_PROVIDER_ENV = 'AI_PROVIDER';

/**
 * Size of every stored vector. Changing it needs a migration of the
 * `knowledge_chunks.embedding` column (vector(1536)) and a full reindex.
 */
export const AI_EMBEDDING_DIMENSIONS = 1536;
/** Texts per embeddings request. */
export const AI_EMBEDDING_BATCH_SIZE = 96;

/** Retry policy and per-attempt timeout shared by every provider. */
export const AI_MAX_ATTEMPTS = 3;
export const AI_RETRY_BASE_MS = 500;
export const AI_TIMEOUT_MS = 30_000;

export const AI_EXTRACTION_SYSTEM_PROMPT = [
  'Você extrai informações estruturadas do conteúdo fornecido pelo usuário.',
  'Responda somente com um JSON válido que siga exatamente o schema informado.',
  'Use null quando a informação não existir no conteúdo; nunca invente valores.',
].join(' ');
