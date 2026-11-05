import type { DatabaseInformation } from '@prisma/client';
import { readDatabaseInformationText } from '../utils/database-information-content';

/** What the web client sees: name and content only, no description. */
export interface DatabaseInformationView {
  id: string;
  name: string;
  content: string;
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
    createdAt: databaseInformation.createdAt,
    updatedAt: databaseInformation.updatedAt,
  };
}
