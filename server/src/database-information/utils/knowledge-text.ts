import { createHash } from 'crypto';

/** Identifies one version of a base's text (see `DatabaseInformation.contentHash`). */
export function hashKnowledgeContent(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

/** pgvector literal ("[0.1,0.2,...]"), sent as a parameter and cast to vector. */
export function toVectorLiteral(vector: number[]): string {
  return `[${vector.join(',')}]`;
}

/**
 * Turns a free-text query into an OR tsquery ("senha | wifi | casa") for the
 * Portuguese full-text search. Only letters and digits survive, so the result
 * is always a valid tsquery; "" when nothing is left.
 */
export function toOrTsQuery(query: string): string {
  const words = query.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];

  return [...new Set(words)].join(' | ');
}
