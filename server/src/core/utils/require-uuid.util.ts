import { isUUID } from 'class-validator';
import { M2mValidationException } from '../errors/m2m.errors';

/**
 * Replaces `data.someId as string`. A missing or malformed id becomes a
 * `validation_error` naming the field, instead of a 404 or a 500 later on.
 */
export function requireUuid(
  data: Record<string, unknown>,
  key: string,
): string {
  const value = data[key];

  if (typeof value !== 'string' || !isUUID(value)) {
    throw new M2mValidationException({
      [key]: 'deve ser um uuid válido obtido na operação de listagem',
    });
  }

  return value;
}
