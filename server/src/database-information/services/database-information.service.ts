import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { KnowledgeIndexStatus } from '@prisma/client';
import type { DatabaseInformation } from '@prisma/client';
import { AiProvider } from '../../ai/contracts/ai-provider.contract';
import { AiProviderError } from '../../ai/errors/ai-provider.error';
import { PrismaService } from '../../prisma/services/prisma.service';
import {
  DATABASE_INFORMATION_AI_MAX_ATTEMPTS,
  DATABASE_INFORMATION_AI_TIMEOUT_MS,
  DATABASE_INFORMATION_EXTRACTION_INSTRUCTIONS,
  DATABASE_INFORMATION_MAX_DESCRIPTION_LENGTH,
  DATABASE_INFORMATION_MAX_NAME_LENGTH,
  MAX_DATABASE_INFORMATION_PER_PROFILE,
} from '../constants/database-information.constant';
import { CreateDatabaseInformationDto } from '../dto/create-database-information.dto';
import { UpdateDatabaseInformationDto } from '../dto/update-database-information.dto';
import {
  DatabaseInformationAssistantView,
  KnowledgeIndexItem,
  toDatabaseInformationAssistantView,
} from '../entities/database-information-assistant.view';
import {
  DatabaseInformationExtraction,
  databaseInformationExtractionSchema,
} from '../entities/database-information-extraction.schema';
import {
  readDatabaseInformationText,
  toContentJson,
} from '../utils/database-information-content';
import { hashKnowledgeContent } from '../utils/knowledge-text';
import { KnowledgeIndexerService } from './knowledge-indexer.service';

const EXTRACTION_FAILED_MESSAGE =
  'Não foi possível analisar a base agora. Tente novamente.';

/** Queues the base for indexing with a fresh attempt budget. */
const PENDING_INDEX = {
  indexStatus: KnowledgeIndexStatus.PENDING,
  indexAttempts: 0,
  indexError: null,
};

@Injectable()
export class DatabaseInformationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiProvider,
    private readonly indexer: KnowledgeIndexerService,
  ) {}

  findAllByProfile(profileId: string): Promise<DatabaseInformation[]> {
    return this.prisma.databaseInformation.findMany({
      where: { profileId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Id, name and description only: the index placed in the assistant context.
   * Every base is listed, indexed or not: reading a whole base
   * (`get_database_information`) does not depend on the RAG index.
   */
  findIndexByProfile(profileId: string): Promise<KnowledgeIndexItem[]> {
    return this.prisma.databaseInformation.findMany({
      where: { profileId },
      select: { id: true, name: true, description: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Full base for the assistant. Another profile's id is a 404. */
  async findOneForAssistant(
    profileId: string,
    id: string,
  ): Promise<DatabaseInformationAssistantView> {
    return toDatabaseInformationAssistantView(
      await this.findOwned(profileId, id),
    );
  }

  /**
   * Extracts name/description synchronously (nothing is saved if it fails),
   * then indexes the text for the RAG in background (status PENDING → READY).
   */
  async create(
    profileId: string,
    data: CreateDatabaseInformationDto,
  ): Promise<DatabaseInformation> {
    const total = await this.prisma.databaseInformation.count({
      where: { profileId },
    });

    if (total >= MAX_DATABASE_INFORMATION_PER_PROFILE) {
      throw new BadRequestException(
        `Limite de ${MAX_DATABASE_INFORMATION_PER_PROFILE} bases de dados por conta atingido.`,
      );
    }

    const { name, description } = await this.extract(data.content);

    const created = await this.prisma.databaseInformation.create({
      data: {
        profileId,
        name,
        description,
        content: toContentJson(data.content),
        contentHash: hashKnowledgeContent(data.content),
      },
    });

    this.indexer.indexInBackground(created.id);

    return created;
  }

  /**
   * Re-extracts name/description and re-indexes whenever the content actually
   * changes. The old chunks stay out of the search until the new ones are in.
   */
  async update(
    profileId: string,
    id: string,
    data: UpdateDatabaseInformationDto,
  ): Promise<DatabaseInformation> {
    const existing = await this.findOwned(profileId, id);

    if (readDatabaseInformationText(existing.content) === data.content) {
      return existing;
    }

    const { name, description } = await this.extract(data.content);

    const updated = await this.prisma.databaseInformation.update({
      where: { id },
      data: {
        name,
        description,
        content: toContentJson(data.content),
        contentHash: hashKnowledgeContent(data.content),
        ...PENDING_INDEX,
      },
    });

    this.indexer.indexInBackground(id);

    return updated;
  }

  /** Manual retry from the web, e.g. after a FAILED indexing. */
  async reindex(profileId: string, id: string): Promise<DatabaseInformation> {
    await this.findOwned(profileId, id);

    const updated = await this.prisma.databaseInformation.update({
      where: { id },
      data: PENDING_INDEX,
    });

    this.indexer.indexInBackground(id);

    return updated;
  }

  /** The chunks go with it: `knowledge_chunks` cascades on the base. */
  async remove(profileId: string, id: string): Promise<DatabaseInformation> {
    await this.findOwned(profileId, id);

    return this.prisma.databaseInformation.delete({ where: { id } });
  }

  private async extract(
    content: string,
  ): Promise<DatabaseInformationExtraction> {
    let extracted: DatabaseInformationExtraction;

    try {
      extracted = await this.ai.extract({
        content,
        instructions: DATABASE_INFORMATION_EXTRACTION_INSTRUCTIONS,
        schema: databaseInformationExtractionSchema,
        timeoutMs: DATABASE_INFORMATION_AI_TIMEOUT_MS,
        maxAttempts: DATABASE_INFORMATION_AI_MAX_ATTEMPTS,
      });
    } catch (error) {
      if (error instanceof AiProviderError) {
        throw new BadGatewayException(EXTRACTION_FAILED_MESSAGE, {
          cause: error,
        });
      }

      throw error;
    }

    const name = extracted.name
      .trim()
      .slice(0, DATABASE_INFORMATION_MAX_NAME_LENGTH);
    const description = extracted.description
      .trim()
      .slice(0, DATABASE_INFORMATION_MAX_DESCRIPTION_LENGTH);

    if (!name || !description) {
      throw new BadGatewayException(EXTRACTION_FAILED_MESSAGE);
    }

    return { name, description };
  }

  private async findOwned(
    profileId: string,
    id: string,
  ): Promise<DatabaseInformation> {
    const databaseInformation = await this.prisma.databaseInformation.findFirst(
      { where: { id, profileId } },
    );

    if (!databaseInformation) {
      throw new NotFoundException('Base de dados não encontrada.');
    }

    return databaseInformation;
  }
}
