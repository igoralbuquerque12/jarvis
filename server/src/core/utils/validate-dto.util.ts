import { Type } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { M2mValidationException } from '../errors/m2m.errors';

/**
 * Validates the `data` object of an M2M operation against a DTO.
 * Unknown keys are rejected on purpose: the model gets a field-level error
 * ("property foo should not exist") it can fix on the single retry the
 * directive allows.
 */
export async function validateDto<T extends object>(
  cls: Type<T>,
  data: Record<string, unknown>,
): Promise<T> {
  const instance = plainToInstance(cls, data);
  const errors = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  if (errors.length > 0) {
    throw M2mValidationException.fromClassValidator(errors);
  }

  return instance;
}
