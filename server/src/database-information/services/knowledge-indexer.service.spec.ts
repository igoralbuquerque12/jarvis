import { Prisma } from '@prisma/client';
import { EmbeddingProvider } from '../../ai/contracts/embedding-provider.contract';
import { PrismaService } from '../../prisma/services/prisma.service';
import { KnowledgeIndexerService } from './knowledge-indexer.service';

describe('KnowledgeIndexerService', () => {
  const id = '5f0c2b3e-8f7a-4d0e-9a3b-2c1d4e5f6a7b';
  const base = {
    profileId: '0f0c2b3e-8f7a-4d0e-9a3b-2c1d4e5f6a7b',
    name: 'Casa',
    content: { text: 'senha do wifi: girassol123' },
    contentHash: 'hash-1',
  };

  function makeIndexer({
    claimed = 1,
    lockedHash = 'hash-1',
    embed = jest.fn().mockResolvedValue([[0.1, 0.2]]),
  } = {}) {
    const tx = {
      $queryRaw: jest
        .fn()
        .mockResolvedValue(
          lockedHash === null ? [] : [{ contentHash: lockedHash }],
        ),
      $executeRaw: jest.fn().mockResolvedValue(1),
      knowledgeChunk: { deleteMany: jest.fn().mockResolvedValue({ count: 3 }) },
      databaseInformation: { update: jest.fn().mockResolvedValue({}) },
    };
    const databaseInformation = {
      updateMany: jest
        .fn()
        .mockResolvedValueOnce({ count: claimed })
        .mockResolvedValue({ count: 1 }),
      findUnique: jest.fn().mockResolvedValue(base),
      findMany: jest.fn().mockResolvedValue([{ id }]),
    };
    const prisma = {
      databaseInformation,
      $transaction: jest.fn((fn: (client: typeof tx) => Promise<unknown>) =>
        fn(tx),
      ),
    };
    const embeddings = { model: 'test-model', embed };

    return {
      tx,
      databaseInformation,
      embed,
      indexer: new KnowledgeIndexerService(
        prisma as unknown as PrismaService,
        embeddings as unknown as EmbeddingProvider,
      ),
    };
  }

  it('claims the base, embeds its chunks and swaps them in one transaction', async () => {
    const { indexer, tx, databaseInformation, embed } = makeIndexer();

    await expect(indexer.index(id)).resolves.toBe('indexed');

    expect(databaseInformation.updateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({ id }) as object,
        data: expect.objectContaining({
          indexStatus: 'PROCESSING',
          indexAttempts: { increment: 1 },
        }) as object,
      }),
    );
    expect(embed).toHaveBeenCalledWith({
      texts: ['Base: Casa\n\nsenha do wifi: girassol123'],
    });
    expect(tx.knowledgeChunk.deleteMany).toHaveBeenCalledWith({
      where: { databaseInformationId: id },
    });
    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
    expect(tx.databaseInformation.update).toHaveBeenCalledWith({
      where: { id },
      data: expect.objectContaining({
        indexStatus: 'READY',
        indexError: null,
        chunkCount: 1,
      }) as object,
    });
  });

  it('skips a base another worker holds or that is already READY', async () => {
    const { indexer, embed } = makeIndexer({ claimed: 0 });

    await expect(indexer.index(id)).resolves.toBe('skipped');
    expect(embed).not.toHaveBeenCalled();
  });

  it('discards the work when the text changed meanwhile', async () => {
    const { indexer, tx } = makeIndexer({ lockedHash: 'hash-2' });

    await expect(indexer.index(id)).resolves.toBe('stale');
    expect(tx.knowledgeChunk.deleteMany).not.toHaveBeenCalled();
    expect(tx.databaseInformation.update).not.toHaveBeenCalled();
  });

  it('stops quietly when the base was deleted meanwhile', async () => {
    const { indexer, tx } = makeIndexer({ lockedHash: null });

    await expect(indexer.index(id)).resolves.toBe('deleted');
    expect(tx.$executeRaw).not.toHaveBeenCalled();
  });

  it('treats a foreign key violation on insert as a deleted base', async () => {
    const { indexer, tx, databaseInformation } = makeIndexer();
    tx.$executeRaw.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('fk', {
        code: 'P2003',
        clientVersion: 'test',
      }),
    );

    await expect(indexer.index(id)).resolves.toBe('deleted');
    expect(databaseInformation.updateMany).toHaveBeenCalledTimes(1);
  });

  it('marks FAILED only for the version it was indexing', async () => {
    const { indexer, databaseInformation } = makeIndexer({
      embed: jest.fn().mockRejectedValue(new Error('provider down')),
    });

    await expect(indexer.index(id)).resolves.toBe('failed');
    expect(databaseInformation.updateMany).toHaveBeenLastCalledWith({
      where: { id, contentHash: 'hash-1', indexStatus: 'PROCESSING' },
      data: { indexStatus: 'FAILED', indexError: 'provider down' },
    });
  });

  it('lists the bases the sweep should pick', async () => {
    const { indexer, databaseInformation } = makeIndexer();

    await expect(indexer.findIndexable(5)).resolves.toEqual([id]);
    expect(databaseInformation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5, select: { id: true } }),
    );
  });
});
