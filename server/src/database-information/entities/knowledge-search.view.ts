/** One chunk returned by the hybrid search. */
export interface KnowledgeSearchHit {
  chunkId: string;
  databaseInformationId: string;
  baseName: string;
  /** Order of the chunk inside its base (0-based). */
  position: number;
  /** Chunk text, starting with the "Base: …" / "Seção: …" header. */
  content: string;
  /** Reciprocal Rank Fusion score (higher is better). */
  score: number;
  /** Cosine similarity of the chunk to the query (-1..1). */
  similarity: number;
}

export interface KnowledgeSearchResult {
  query: string;
  found: boolean;
  results: KnowledgeSearchHit[];
}

/** What the assistant receives from `search_knowledge`. */
export interface KnowledgeSearchAssistantView {
  query: string;
  found: boolean;
  results: {
    databaseInformationId: string;
    baseName: string;
    content: string;
  }[];
}

export function toKnowledgeSearchAssistantView(
  result: KnowledgeSearchResult,
): KnowledgeSearchAssistantView {
  return {
    query: result.query,
    found: result.found,
    results: result.results.map(
      ({ databaseInformationId, baseName, content }) => ({
        databaseInformationId,
        baseName,
        content,
      }),
    ),
  };
}
