import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { HealthCheckConfig, HealthCheckHttpMethod } from '@prisma/client';
import { PrismaService } from '../../prisma/services/prisma.service';
import { RedisService } from '../../redis/services/redis.service';
import {
  HEALTH_CHECK_CACHE_KEY,
  HEALTH_CHECK_CACHE_TTL_SECONDS,
} from '../constants/health-check.constant';
import { CreateHealthCheckConfigDto } from '../dto/create-health-check-config.dto';
import { UpdateHealthCheckConfigDto } from '../dto/update-health-check-config.dto';
import { HealthCheckCryptoService } from './health-check-crypto.service';

export interface CachedHealthCheckConfig {
  id: string;
  profileId: string;
  name: string;
  url: string;
  httpMethod: HealthCheckHttpMethod;
  endpoint: string;
  authKey: string | null;
  authValue: string | null;
  alertMessage: string;
  profile: {
    id: string;
    name: string;
    jid: string | null;
    timezone: string;
    active: boolean;
  };
}

@Injectable()
export class HealthCheckService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly cryptoService: HealthCheckCryptoService,
  ) {}

  findAllByProfile(profileId: string): Promise<HealthCheckConfig[]> {
    return this.prisma.healthCheckConfig.findMany({
      where: { profileId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    profileId: string,
    data: CreateHealthCheckConfigDto,
  ): Promise<HealthCheckConfig> {
    const { authKey, encryptedAuthValue } = this.prepareAuthFields(
      data.authKey,
      data.authValue,
    );

    const created = await this.prisma.healthCheckConfig.create({
      data: {
        profileId,
        name: data.name.trim(),
        url: data.url.trim(),
        httpMethod: data.httpMethod,
        endpoint: (data.endpoint ?? '').trim(),
        authKey,
        authValue: encryptedAuthValue,
        alertMessage: data.alertMessage.trim(),
      },
    });

    await this.invalidateCache();

    return created;
  }

  async update(
    profileId: string,
    id: string,
    data: UpdateHealthCheckConfigDto,
  ): Promise<HealthCheckConfig> {
    const existing = await this.findOwned(profileId, id);

    let nextAuthKey = existing.authKey;
    let nextAuthValue = existing.authValue;

    if (data.authKey !== undefined || data.authValue !== undefined) {
      const candidateKey =
        data.authKey !== undefined ? data.authKey : existing.authKey;
      const trimmedKey = candidateKey?.trim() ?? '';

      if (!trimmedKey) {
        nextAuthKey = null;
        nextAuthValue = null;
      } else {
        nextAuthKey = trimmedKey;
        if (data.authValue !== undefined) {
          const trimmedValue = data.authValue ?? '';
          if (!trimmedValue) {
            throw new BadRequestException(
              'O valor de autenticação (authValue) é obrigatório quando authKey é informado.',
            );
          }
          nextAuthValue = this.cryptoService.encrypt(trimmedValue);
        } else if (!existing.authValue) {
          throw new BadRequestException(
            'O valor de autenticação (authValue) é obrigatório quando authKey é informado.',
          );
        }
      }
    }

    const updated = await this.prisma.healthCheckConfig.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.url !== undefined ? { url: data.url.trim() } : {}),
        ...(data.httpMethod !== undefined
          ? { httpMethod: data.httpMethod }
          : {}),
        ...(data.endpoint !== undefined
          ? { endpoint: data.endpoint.trim() }
          : {}),
        ...(data.alertMessage !== undefined
          ? { alertMessage: data.alertMessage.trim() }
          : {}),
        authKey: nextAuthKey,
        authValue: nextAuthValue,
      },
    });

    await this.invalidateCache();

    return updated;
  }

  async remove(profileId: string, id: string): Promise<HealthCheckConfig> {
    await this.findOwned(profileId, id);

    const deleted = await this.prisma.healthCheckConfig.delete({
      where: { id },
    });

    await this.invalidateCache();

    return deleted;
  }

  /**
   * Fetches all active HealthCheckConfig records from Redis cache.
   * If cache is expired or invalidated, loads from PostgreSQL and stores in
   * Redis for 3 days (HEALTH_CHECK_CACHE_TTL_SECONDS).
   */
  async getConfigsForExecution(): Promise<CachedHealthCheckConfig[]> {
    const client = this.redisService.getClient();
    const raw = await client.get(HEALTH_CHECK_CACHE_KEY);

    if (raw !== null) {
      return JSON.parse(raw) as CachedHealthCheckConfig[];
    }

    const configs = await this.prisma.healthCheckConfig.findMany({
      where: {
        profile: {
          active: true,
        },
      },
      include: {
        profile: {
          select: {
            id: true,
            name: true,
            jid: true,
            timezone: true,
            active: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const cached: CachedHealthCheckConfig[] = configs.map((config) => ({
      id: config.id,
      profileId: config.profileId,
      name: config.name,
      url: config.url,
      httpMethod: config.httpMethod,
      endpoint: config.endpoint,
      authKey: config.authKey,
      authValue: config.authValue,
      alertMessage: config.alertMessage,
      profile: config.profile,
    }));

    await client.set(HEALTH_CHECK_CACHE_KEY, JSON.stringify(cached), {
      expiration: { type: 'EX', value: HEALTH_CHECK_CACHE_TTL_SECONDS },
    });

    return cached;
  }

  async invalidateCache(): Promise<void> {
    await this.redisService.getClient().del(HEALTH_CHECK_CACHE_KEY);
  }

  private prepareAuthFields(
    authKey?: string | null,
    authValue?: string | null,
  ): { authKey: string | null; encryptedAuthValue: string | null } {
    const cleanKey = authKey?.trim() ?? '';
    const cleanValue = authValue ?? '';

    if (!cleanKey && !cleanValue) {
      return { authKey: null, encryptedAuthValue: null };
    }

    if (!cleanKey || !cleanValue) {
      throw new BadRequestException(
        'Para usar autenticação no header, informe tanto authKey quanto authValue.',
      );
    }

    return {
      authKey: cleanKey,
      encryptedAuthValue: this.cryptoService.encrypt(cleanValue),
    };
  }

  private async findOwned(
    profileId: string,
    id: string,
  ): Promise<HealthCheckConfig> {
    const config = await this.prisma.healthCheckConfig.findFirst({
      where: { id, profileId },
    });

    if (!config) {
      throw new NotFoundException(`Health check config ${id} not found`);
    }

    return config;
  }
}
