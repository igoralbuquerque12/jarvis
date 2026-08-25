import { BadRequestException, Type } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';

export async function validateDto<T extends object>(
  cls: Type<T>,
  data: Record<string, unknown>,
): Promise<T> {
  const instance = plainToInstance(cls, data);
  try {
    await validateOrReject(instance);
    return instance;
  } catch (errors) {
    throw new BadRequestException(errors);
  }
}
