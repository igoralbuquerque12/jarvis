import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

@Injectable()
export class WhatsappAdminGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const expectedKey = this.configService.get<string>(
      'WHATSAPP_ADMIN_API_KEY',
    );

    if (!expectedKey) {
      throw new UnauthorizedException(
        'WhatsApp administrative access is not configured.',
      );
    }

    const providedKey = this.extractApiKey(request);

    if (!providedKey) {
      throw new UnauthorizedException(
        'Administrative key is required in headers (x-admin-key, x-api-key, or Authorization: Bearer <key>).',
      );
    }

    if (!this.safeCompare(providedKey, expectedKey)) {
      throw new UnauthorizedException('Invalid administrative key.');
    }

    return true;
  }

  private extractApiKey(request: Request): string | null {
    const headers = request.headers;

    const customKey = headers['x-admin-key'];

    if (typeof customKey === 'string' && customKey.trim().length > 0) {
      return customKey.trim();
    }

    const authHeader = headers['authorization'];
    if (typeof authHeader === 'string') {
      const trimmed = authHeader.trim();
      if (trimmed.toLowerCase().startsWith('bearer ')) {
        const token = trimmed.slice(7).trim();
        return token.length > 0 ? token : null;
      }
      return trimmed.length > 0 ? trimmed : null;
    }

    return null;
  }

  private safeCompare(a: string, b: string): boolean {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');

    if (bufA.length !== bufB.length) {
      return false;
    }

    return timingSafeEqual(bufA, bufB);
  }
}
