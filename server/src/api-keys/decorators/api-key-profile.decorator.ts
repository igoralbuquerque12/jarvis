import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Profile } from '@prisma/client';
import type { Request } from 'express';

/** Reads the profile resolved by `ApiKeyGuard`. Use only on guarded routes. */
export const ApiKeyProfile = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Profile => {
    const request = context.switchToHttp().getRequest<Request>();

    if (!request.apiKeyProfile) {
      throw new InternalServerErrorException(
        'ApiKeyProfile used on a route without ApiKeyGuard.',
      );
    }

    return request.apiKeyProfile;
  },
);
