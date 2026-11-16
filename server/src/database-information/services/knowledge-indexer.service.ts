import { Injectable, Logger } from '@nestjs/common';
import { KnowledgeIndexStatus, Prisma } from '@prisma/client';
import { EmbeddingProvider } from '../../ai/contracts/embedding-provider.contract';
import { PrismaService } from '../../prisma/services/prisma.service';
import {
  KNOWLEDGE_INDEX_ERROR_MAX_LENGTH,
  KNOWLEDGE_INDEX_MAX_ATTEMPTS,
  KNOWLEDGE_INDEX_STALE_MS,
} from '../constants/database-information.constant';
import { readDatabaseInformationText } from '../utils/database-information-content';
import { chunkKnowledgeText } from '../utils/knowledge-chunker';
import { toVectorLiteral } from '../utils/knowledge-text';

export type KnowledgeIndexOutcome =
  /** Another worker holds it, or it is READY / out of automatic attempts. */
  | 'skipped'
  | 'indexed'
  /** The text changed while indexing: the newer version wins. */
  | 'stale'
  /** The base was deleted while indexing. */
  | 'deleted'
  | 'failed';

/**
 * Turns a base's text into searchable chunks (text + pgvector embedding).
 *
 * Lifecycle on `database_informations.indexStatus`:
 * PENDING → PROCESSING → READY | FAILED. Indexing is idempotent, so (unlike
 * events) it is retried: by the sweep schedule up to
 * KNOWLEDGE_INDEX_MAX_ATTEMPTS, and on demand by the user.
 *
 * The old chunks are replaced in one transaction that locks the base row and
 * re-checks `contentHash`, so a search never sees a half-written base and an
 * edit made during indexing is never overwritten by the older text.
 */
@Injectable()
export class KnowledgeIndexerService {
  private readonly logger = new Logger(KnowledgeIndexerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddings: EmbeddingProvider,
  ) {}

  /** Fire-and-forget entry point used right after a save. */
  indexInBackground(id: string): void {
    this.index(id).catch((error: unknown) => {
      this.logger.error(
        `Background indexing of ${id} crashed: ${(error as Error).message}`,
      );
    });
  }

  /** Bases the sweep should (re)index now. */
  async findIndexable(limit: number): Promise<string[]> {
    const rows = await this.prisma.databaseInformation.findMany({
      where: this.claimableWhere(new Date()),
      select: { id: true },
      orderBy: { updatedAt: 'asc' },
      take: limit,
    });

    return rows.map((row) => row.id);
  }

  async index(id: string): Promise<KnowledgeIndexOutcome> {
    const now = new Date();
    const claimed = await this.prisma.databaseInformation.updateMany({
      where: { id, ...this.claimableWhere(now) },
      data: {
        indexStatus: KnowledgeIndexStatus.PROCESSING,
        indexStartedAt: now,
        indexAttempts: { increment: 1 },
      },
    });

    if (claimed.count === 0) {
      return 'skipped';
    }

    const base = await this.prisma.databaseInformation.findUnique({
      where: { id },
      select: { profileId: true, name: true, content: true, contentHash: true },
    });

    if (!base) {
      return 'deleted';
    }

    try {
      const chunks = chunkKnowledgeText(
        base.name,
        readDatabaseInformationText(base.content),
      );
      const vectors = await this.embeddings.embed({ texts: chunks });

      return await this.replaceChunks(id, base, chunks, vectors);
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        return 'deleted';
      }

      const message = (error as Error).message ?? 'Unknown indexing error.';
      this.logger.error(`Indexing of ${id} failed: ${message}`);

      // Scoped to this version of the text: never clobbers a newer save.
      await this.prisma.databaseInformation.updateMany({
        where: {
          id,
          contentHash: base.contentHash,
          indexStatus: KnowledgeIndexStatus.PROCESSING,
        },
        data: {
          indexStatus: KnowledgeIndexStatus.FAILED,
          indexError: message.slice(0, KNOWLEDGE_INDEX_ERROR_MAX_LENGTH),
        },
      });

      return 'failed';
    }
  }

  private async replaceChunks(
    id: string,
    base: { profileId: string; contentHash: string },
    chunks: string[],
    vectors: number[][],
  ): Promise<KnowledgeIndexOutcome> {
    const model = this.embeddings.model;

    return this.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<{ contentHash: string }[]>`
        SELECT "contentHash" FROM "database_informations"
        WHERE "id" = ${id}::uuid
        FOR UPDATE
      `;

      if (locked.length === 0) {
        return 'deleted';
      }

      if (locked[0].contentHash !== base.contentHash) {
        return 'stale';
      }

      await tx.knowledgeChunk.deleteMany({
        where: { databaseInformationId: id },
      });

      if (chunks.length > 0) {
        const rows = chunks.map(
          (content, position) => Prisma.sql`(
            gen_random_uuid(),
            ${base.profileId}::uuid,
            ${id}::uuid,
            ${position},
            ${content},
            ${toVectorLiteral(vectors[position])}::vector,
            ${model}
          )`,
        );

        await tx.$executeRaw`
          INSERT INTO "knowledge_chunks"
            ("id", "profileId", "databaseInformationId", "position", "content", "embedding", "embeddingModel")
          VALUES ${Prisma.join(rows)}
        `;
      }

      await tx.databaseInformation.update({
        where: { id },
        data: {
          indexStatus: KnowledgeIndexStatus.READY,
          indexError: null,
          indexedAt: new Date(),
          chunkCount: chunks.length,
        },
      });

      return 'indexed';
    });
  }

  private claimableWhere(now: Date): Prisma.DatabaseInformationWhereInput {
    return {
      OR: [
        { indexStatus: KnowledgeIndexStatus.PENDING },
        {
          indexStatus: KnowledgeIndexStatus.FAILED,
          indexAttempts: { lt: KNOWLEDGE_INDEX_MAX_ATTEMPTS },
        },
        // Abandoned by a restart; bounded too, in case indexing itself
        // kills the process.
        {
          indexStatus: KnowledgeIndexStatus.PROCESSING,
          indexAttempts: { lt: KNOWLEDGE_INDEX_MAX_ATTEMPTS },
          indexStartedAt: {
            lt: new Date(now.getTime() - KNOWLEDGE_INDEX_STALE_MS),
          },
        },
      ],
    };
  }
}

/** The base (or its profile) was deleted mid-way: the chunk insert hits the FK. */
function isForeignKeyViolation(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === 'P2003' || error.message.includes('23503');
  }

  return error instanceof Error && /23503|foreign key/i.test(error.message);
}
