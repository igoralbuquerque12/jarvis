import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Request } from 'express';

/** Reads the API key ID resolved by `ApiKeyGuard`. Use only on guarded routes. */
export const ApiKeyId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<Request>();

    if (!request.apiKeyId) {
      throw new InternalServerErrorException(
        'ApiKeyId used on a route without ApiKeyGuard.',
      );
    }

    return request.apiKeyId;
  },
);
