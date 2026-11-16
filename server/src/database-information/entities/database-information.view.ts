import type { DatabaseInformation, KnowledgeIndexStatus } from '@prisma/client';
import { readDatabaseInformationText } from '../utils/database-information-content';

/**
 * What the web client sees: name, content and the RAG indexing status. The
 * description and the raw indexing error stay in the database.
 */
export interface DatabaseInformationView {
  id: string;
  name: string;
  content: string;
  indexStatus: KnowledgeIndexStatus;
  indexedAt: Date | null;
  chunkCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export function toDatabaseInformationView(
  databaseInformation: DatabaseInformation,
): DatabaseInformationView {
  return {
    id: databaseInformation.id,
    name: databaseInformation.name,
    content: readDatabaseInformationText(databaseInformation.content),
    indexStatus: databaseInformation.indexStatus,
    indexedAt: databaseInformation.indexedAt,
    chunkCount: databaseInformation.chunkCount,
    createdAt: databaseInformation.createdAt,
    updatedAt: databaseInformation.updatedAt,
  };
}
