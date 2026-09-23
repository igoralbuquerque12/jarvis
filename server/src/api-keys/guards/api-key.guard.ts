import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiKeysService } from '../services/api-keys.service';
import { extractApiKey } from '../utils/extract-api-key';

/**
 * Protects public endpoints with a per-profile API key.
 * On success the owner profile is attached to the request and can be read
 * with the `@ApiKeyProfile()` decorator.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const secret = extractApiKey(request.headers);

    if (!secret) {
      throw new UnauthorizedException(
        'Informe a chave de API em "Authorization: Bearer <chave>" ou "x-api-key".',
      );
    }

    const apiKey = await this.apiKeysService.verify(secret);

    if (!apiKey) {
      throw new UnauthorizedException('Chave de API inválida ou inativa.');
    }

    this.apiKeysService.touchLastUsed(apiKey.id);
    request.apiKeyProfile = apiKey.profile;
    request.apiKeyId = apiKey.id;

    return true;
  }
}
