/** Maximum number of knowledge bases a single profile may hold. */
export const MAX_DATABASE_INFORMATION_PER_PROFILE = 10;

export const DATABASE_INFORMATION_MAX_CONTENT_LENGTH = 20_000;
export const DATABASE_INFORMATION_MAX_NAME_LENGTH = 80;
export const DATABASE_INFORMATION_MAX_DESCRIPTION_LENGTH = 300;

/** The extraction runs inside the HTTP request, so the budget is tight. */
export const DATABASE_INFORMATION_AI_TIMEOUT_MS = 15_000;
export const DATABASE_INFORMATION_AI_MAX_ATTEMPTS = 2;

export const DATABASE_INFORMATION_EXTRACTION_INSTRUCTIONS = [
  'Analise a base de dados em texto abaixo e extraia:',
  `- name: um nome objetivo para a base, com no máximo 5 palavras e ${DATABASE_INFORMATION_MAX_NAME_LENGTH} caracteres.`,
  `- description: uma descrição objetiva do que a base trata, com no máximo 2 frases e ${DATABASE_INFORMATION_MAX_DESCRIPTION_LENGTH} caracteres.`,
  'Escreva em português e descreva apenas o que está no conteúdo.',
].join('\n');

// --- RAG: chunking --------------------------------------------------------

/** A chunk is closed once it reaches the target; no chunk body exceeds the max. */
export const KNOWLEDGE_CHUNK_TARGET_CHARS = 1_000;
export const KNOWLEDGE_CHUNK_MAX_CHARS = 1_200;
/** Tail of the previous chunk repeated at the start of the next one. */
export const KNOWLEDGE_CHUNK_OVERLAP_CHARS = 150;
/** A short line ending with ":" is read as a section label. */
export const KNOWLEDGE_SECTION_LABEL_MAX_CHARS = 80;

// --- RAG: indexing --------------------------------------------------------

/** Automatic attempts before a base stays FAILED until the user retries. */
export const KNOWLEDGE_INDEX_MAX_ATTEMPTS = 3;
/** A PROCESSING base older than this is considered abandoned (server restart). */
export const KNOWLEDGE_INDEX_STALE_MS = 5 * 60_000;
/** Bases picked per sweep tick. */
export const KNOWLEDGE_INDEX_SWEEP_BATCH = 20;
export const KNOWLEDGE_INDEX_ERROR_MAX_LENGTH = 500;

// --- RAG: search ----------------------------------------------------------

export const KNOWLEDGE_SEARCH_QUERY_MAX_LENGTH = 500;
/** Candidates kept from each ranking (vector and full-text) before fusion. */
export const KNOWLEDGE_SEARCH_CANDIDATES = 20;
export const KNOWLEDGE_SEARCH_MAX_RESULTS = 5;
/** Cap on the text returned to the model, summed over every result. */
export const KNOWLEDGE_SEARCH_MAX_TOTAL_CHARS = 6_000;
/**
 * Minimum cosine similarity for a vector-only hit (full-text hits always
 * count). Initial guess for text-embedding-3-small: tune with
 * `knowledge_search_logs`.
 */
export const KNOWLEDGE_SEARCH_MIN_SIMILARITY = 0.3;
/** Reciprocal Rank Fusion constant (the usual 60). */
export const KNOWLEDGE_SEARCH_RRF_K = 60;
/** The query embedding runs while the model waits on WhatsApp. */
export const KNOWLEDGE_SEARCH_EMBED_TIMEOUT_MS = 10_000;
export const KNOWLEDGE_SEARCH_EMBED_MAX_ATTEMPTS = 2;
