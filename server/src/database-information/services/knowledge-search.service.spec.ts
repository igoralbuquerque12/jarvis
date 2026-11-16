import { EmbeddingProvider } from '../../ai/contracts/embedding-provider.contract';
import { PrismaService } from '../../prisma/services/prisma.service';
import {
  KNOWLEDGE_SEARCH_MAX_RESULTS,
  KNOWLEDGE_SEARCH_MAX_TOTAL_CHARS,
  KNOWLEDGE_SEARCH_MIN_SIMILARITY,
} from '../constants/database-information.constant';
import {
  KnowledgeSearchService,
  selectResults,
} from './knowledge-search.service';

type Row = Parameters<typeof selectResults>[0][number];

const row = (
  id: string,
  similarity: number,
  textRank = 0,
  content = id,
): Row => ({
  id,
  databaseInformationId: 'base-1',
  baseName: 'Casa',
  position: 0,
  content,
  similarity,
  textRank,
});

describe('selectResults', () => {
  it('drops vector-only hits below the minimum similarity', () => {
    const hits = selectResults([
      row('close', KNOWLEDGE_SEARCH_MIN_SIMILARITY + 0.2),
      row('far', KNOWLEDGE_SEARCH_MIN_SIMILARITY - 0.1),
    ]);

    expect(hits.map((hit) => hit.chunkId)).toEqual(['close']);
  });

  it('keeps a full-text hit even with low similarity (exact names, codes)', () => {
    const hits = selectResults([row('plate', 0.05, 0.4)]);

    expect(hits.map((hit) => hit.chunkId)).toEqual(['plate']);
  });

  it('puts a chunk found by both rankings first', () => {
    const hits = selectResults([
      row('vector-only', 0.9),
      row('both', 0.8, 0.3),
      row('text-only', 0.1, 0.5),
    ]);

    expect(hits[0].chunkId).toBe('both');
  });

  it('caps the number of results and the total size', () => {
    const many = Array.from({ length: 10 }, (_, index) =>
      row(`c${index}`, 0.9 - index * 0.01),
    );
    expect(selectResults(many)).toHaveLength(KNOWLEDGE_SEARCH_MAX_RESULTS);

    const big = 'x'.repeat(KNOWLEDGE_SEARCH_MAX_TOTAL_CHARS - 10);
    const sized = selectResults([
      row('a', 0.9, 0, big),
      row('b', 0.8, 0, 'y'.repeat(50)),
    ]);
    expect(sized.map((hit) => hit.chunkId)).toEqual(['a']);
  });

  it('returns nothing when nothing qualifies', () => {
    expect(selectResults([row('far', 0)])).toEqual([]);
  });
});

describe('KnowledgeSearchService', () => {
  function makeService(rows: Row[]) {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue(rows),
      knowledgeSearchLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const embeddings = {
      model: 'test-model',
      embed: jest.fn().mockResolvedValue([[0.1, 0.2]]),
    };

    return {
      prisma,
      embeddings,
      service: new KnowledgeSearchService(
        prisma as unknown as PrismaService,
        embeddings as unknown as EmbeddingProvider,
      ),
    };
  }

  it('embeds the query, ranks the profile chunks and logs the search', async () => {
    const { service, prisma, embeddings } = makeService([row('c1', 0.7, 0.2)]);

    const result = await service.search('profile-1', 'senha wifi', {
      runId: 'run-1',
    });

    expect(result).toMatchObject({
      query: 'senha wifi',
      found: true,
      results: [{ chunkId: 'c1', baseName: 'Casa' }],
    });
    expect(embeddings.embed).toHaveBeenCalledWith(
      expect.objectContaining({ texts: ['senha wifi'] }),
    );
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    expect(prisma.knowledgeSearchLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        profileId: 'profile-1',
        runId: 'run-1',
        query: 'senha wifi',
      }) as object,
    });
  });

  it('answers found=false when no chunk qualifies', async () => {
    const { service } = makeService([]);

    await expect(service.search('profile-1', 'nada')).resolves.toEqual({
      query: 'nada',
      found: false,
      results: [],
    });
  });

  it('never fails the search because the log could not be written', async () => {
    const { service, prisma } = makeService([row('c1', 0.7)]);
    prisma.knowledgeSearchLog.create.mockRejectedValue(new Error('db busy'));

    await expect(service.search('profile-1', 'x')).resolves.toMatchObject({
      found: true,
    });
  });
});
