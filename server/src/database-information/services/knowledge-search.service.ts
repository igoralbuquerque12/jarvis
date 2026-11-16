import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EmbeddingProvider } from '../../ai/contracts/embedding-provider.contract';
import { PrismaService } from '../../prisma/services/prisma.service';
import {
  KNOWLEDGE_SEARCH_CANDIDATES,
  KNOWLEDGE_SEARCH_EMBED_MAX_ATTEMPTS,
  KNOWLEDGE_SEARCH_EMBED_TIMEOUT_MS,
  KNOWLEDGE_SEARCH_MAX_RESULTS,
  KNOWLEDGE_SEARCH_MAX_TOTAL_CHARS,
  KNOWLEDGE_SEARCH_MIN_SIMILARITY,
} from '../constants/database-information.constant';
import type {
  KnowledgeSearchHit,
  KnowledgeSearchResult,
} from '../entities/knowledge-search.view';
import { toOrTsQuery, toVectorLiteral } from '../utils/knowledge-text';
import { fuseRankings } from '../utils/rank-fusion';

type CandidateRow = {
  id: string;
  databaseInformationId: string;
  baseName: string;
  position: number;
  content: string;
  similarity: number;
  textRank: number;
};

export type KnowledgeSearchOptions = {
  /** Restricts the search to one base. */
  databaseInformationId?: string;
  /** Run that asked, recorded in the search log. */
  runId?: string;
};

/**
 * Hybrid search over the chunks of a profile's READY bases: cosine similarity
 * (meaning) and Portuguese full-text search (exact names, numbers, codes),
 * fused by Reciprocal Rank Fusion.
 *
 * There is no ANN index on purpose: every query is scoped to one profile
 * (at most a few hundred chunks), so the exact scan through the `profileId`
 * index is sub-millisecond with perfect recall, while HNSW + filter could
 * return fewer rows than asked.
 */
@Injectable()
export class KnowledgeSearchService {
  private readonly logger = new Logger(KnowledgeSearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddings: EmbeddingProvider,
  ) {}

  async search(
    profileId: string,
    query: string,
    options: KnowledgeSearchOptions = {},
  ): Promise<KnowledgeSearchResult> {
    const [vector] = await this.embeddings.embed({
      texts: [query],
      timeoutMs: KNOWLEDGE_SEARCH_EMBED_TIMEOUT_MS,
      maxAttempts: KNOWLEDGE_SEARCH_EMBED_MAX_ATTEMPTS,
    });

    const candidates = await this.findCandidates(
      profileId,
      vector,
      toOrTsQuery(query),
      options.databaseInformationId,
    );
    const results = selectResults(candidates);

    this.log(profileId, query, options.runId, results);

    return { query, found: results.length > 0, results };
  }

  private findCandidates(
    profileId: string,
    vector: number[],
    tsQuery: string,
    databaseInformationId?: string,
  ): Promise<CandidateRow[]> {
    const textRank = tsQuery
      ? Prisma.sql`ts_rank_cd(to_tsvector('portuguese', c."content"), to_tsquery('portuguese', ${tsQuery}))`
      : Prisma.sql`0`;
    const baseFilter = databaseInformationId
      ? Prisma.sql`AND c."databaseInformationId" = ${databaseInformationId}::uuid`
      : Prisma.empty;

    return this.prisma.$queryRaw<CandidateRow[]>`
      SELECT
        c."id",
        c."databaseInformationId",
        d."name" AS "baseName",
        c."position",
        c."content",
        (1 - (c."embedding" <=> ${toVectorLiteral(vector)}::vector))::float8 AS "similarity",
        (${textRank})::float8 AS "textRank"
      FROM "knowledge_chunks" c
      JOIN "database_informations" d ON d."id" = c."databaseInformationId"
      WHERE c."profileId" = ${profileId}::uuid
        AND d."indexStatus" = 'READY'
        AND c."embeddingModel" = ${this.embeddings.model}
        ${baseFilter}
    `;
  }

  private log(
    profileId: string,
    query: string,
    runId: string | undefined,
    results: KnowledgeSearchHit[],
  ) {
    this.prisma.knowledgeSearchLog
      .create({
        data: {
          profileId,
          runId: runId ?? null,
          query,
          results: results.map(
            ({
              chunkId,
              databaseInformationId,
              position,
              score,
              similarity,
            }) => ({
              chunkId,
              databaseInformationId,
              position,
              score,
              similarity,
            }),
          ),
        },
      })
      .catch((error: unknown) => {
        this.logger.warn(
          `Could not record knowledge search: ${(error as Error).message}`,
        );
      });
  }
}

/**
 * Ranks the candidates twice, fuses both rankings and keeps the best ones
 * within the result and size caps. A vector-only hit needs the minimum
 * similarity; a full-text hit always qualifies.
 */
export function selectResults(
  candidates: CandidateRow[],
): KnowledgeSearchHit[] {
  const byId = new Map(candidates.map((row) => [row.id, row]));

  const vectorRanking = candidates
    .filter((row) => row.similarity >= KNOWLEDGE_SEARCH_MIN_SIMILARITY)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, KNOWLEDGE_SEARCH_CANDIDATES)
    .map((row) => row.id);
  const textRanking = candidates
    .filter((row) => row.textRank > 0)
    .sort((a, b) => b.textRank - a.textRank)
    .slice(0, KNOWLEDGE_SEARCH_CANDIDATES)
    .map((row) => row.id);

  const hits: KnowledgeSearchHit[] = [];
  let totalChars = 0;

  for (const { id, score } of fuseRankings([vectorRanking, textRanking])) {
    const row = byId.get(id)!;

    if (
      hits.length > 0 &&
      totalChars + row.content.length > KNOWLEDGE_SEARCH_MAX_TOTAL_CHARS
    ) {
      break;
    }

    hits.push({
      chunkId: row.id,
      databaseInformationId: row.databaseInformationId,
      baseName: row.baseName,
      position: row.position,
      content: row.content,
      score: round(score),
      similarity: round(row.similarity),
    });
    totalChars += row.content.length;

    if (hits.length >= KNOWLEDGE_SEARCH_MAX_RESULTS) {
      break;
    }
  }

  return hits;
}

function round(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
