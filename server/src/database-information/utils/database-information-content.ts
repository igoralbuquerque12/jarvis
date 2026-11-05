import type { Prisma } from '@prisma/client';

/** Shape stored in the `content` jsonb column. */
export interface DatabaseInformationContent {
  text: string;
}

export function toContentJson(text: string): Prisma.InputJsonObject {
  return { text };
}

export function readDatabaseInformationText(content: unknown): string {
  const text = (content as Partial<DatabaseInformationContent> | null)?.text;

  return typeof text === 'string' ? text : '';
}
