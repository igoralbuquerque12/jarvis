import type { DatabaseInformation } from '@prisma/client';
import { readDatabaseInformationText } from '../utils/database-information-content';

/** One line of the index the assistant receives in its context. */
export interface KnowledgeIndexItem {
  id: string;
  name: string;
  description: string;
}

/** What the assistant gets when it reads a base. */
export interface DatabaseInformationAssistantView extends KnowledgeIndexItem {
  content: string;
}

export function toDatabaseInformationAssistantView(
  databaseInformation: DatabaseInformation,
): DatabaseInformationAssistantView {
  return {
    id: databaseInformation.id,
    name: databaseInformation.name,
    description: databaseInformation.description,
    content: readDatabaseInformationText(databaseInformation.content),
  };
}
