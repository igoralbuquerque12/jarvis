import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ApiKey, Profile } from '@prisma/client';
import { PrismaService } from '../../prisma/services/prisma.service';
import { MAX_API_KEYS_PER_PROFILE } from '../constants/api-keys.constant';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';
import { UpdateApiKeyDto } from '../dto/update-api-key.dto';
import { CreatedApiKeyView, toApiKeyView } from '../entities/api-key.view';
import {
  generateApiKey,
  hashApiKey,
  looksLikeApiKey,
} from '../utils/generate-api-key';

export type ApiKeyWithProfile = ApiKey & { profile: Profile };

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  findAllByProfile(profileId: string) {
    return this.prisma.apiKey.findMany({
      where: { profileId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Creates a key and returns the secret. This is the only moment the
   * secret exists in clear text: the database keeps just its hash.
   */
  async create(
    profileId: string,
    data: CreateApiKeyDto,
  ): Promise<CreatedApiKeyView> {
    const total = await this.prisma.apiKey.count({ where: { profileId } });

    if (total >= MAX_API_KEYS_PER_PROFILE) {
      throw new BadRequestException(
        `Limite de ${MAX_API_KEYS_PER_PROFILE} chaves por conta atingido.`,
      );
    }

    const generated = generateApiKey();
    const apiKey = await this.prisma.apiKey.create({
      data: {
        profileId,
        name: data.name.trim(),
        prefix: generated.prefix,
        hash: generated.hash,
      },
    });

    return { ...toApiKeyView(apiKey), secret: generated.secret };
  }

  async update(profileId: string, id: string, data: UpdateApiKeyDto) {
    await this.findOwned(profileId, id);

    return this.prisma.apiKey.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
      },
    });
  }

  async remove(profileId: string, id: string) {
    await this.findOwned(profileId, id);

    return this.prisma.apiKey.delete({ where: { id } });
  }

  /**
   * Resolves a secret sent by a client to its key + owner profile.
   * Returns null for unknown, inactive or malformed keys.
   */
  async verify(secret: string): Promise<ApiKeyWithProfile | null> {
    if (!looksLikeApiKey(secret)) {
      return null;
    }

    const apiKey = await this.prisma.apiKey.findUnique({
      where: { hash: hashApiKey(secret) },
      include: { profile: true },
    });

    if (!apiKey || !apiKey.active || !apiKey.profile.active) {
      return null;
    }

    return apiKey;
  }

  /** Best-effort usage tracking; never blocks the request. */
  touchLastUsed(id: string): void {
    void this.prisma.apiKey
      .update({ where: { id }, data: { lastUsedAt: new Date() } })
      .catch(() => undefined);
  }

  private async findOwned(profileId: string, id: string) {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id, profileId },
    });

    if (!apiKey) {
      throw new NotFoundException(`API key ${id} not found`);
    }

    return apiKey;
  }
}
