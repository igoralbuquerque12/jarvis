import { BadRequestException, NotFoundException } from '@nestjs/common';
import { HealthCheckHttpMethod } from '@prisma/client';
import { PrismaService } from '../../prisma/services/prisma.service';
import { RedisService } from '../../redis/services/redis.service';
import {
  HEALTH_CHECK_CACHE_KEY,
  HEALTH_CHECK_CACHE_TTL_SECONDS,
} from '../constants/health-check.constant';
import { HealthCheckCryptoService } from './health-check-crypto.service';
import { HealthCheckService } from './health-check.service';

describe('HealthCheckService', () => {
  let service: HealthCheckService;
  let prisma: {
    healthCheckConfig: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let redisClient: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
  };
  let cryptoService: {
    encrypt: jest.Mock;
    decrypt: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      healthCheckConfig: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    redisClient = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };
    cryptoService = {
      encrypt: jest.fn((val: string) => `enc:${val}`),
      decrypt: jest.fn((val: string) => val.replace(/^enc:/, '')),
    };

    const redisService = {
      getClient: () => redisClient,
    } as unknown as RedisService;

    service = new HealthCheckService(
      prisma as unknown as PrismaService,
      redisService,
      cryptoService as unknown as HealthCheckCryptoService,
    );
  });

  it('encrypts authValue on create and invalidates the Redis cache', async () => {
    prisma.healthCheckConfig.create.mockResolvedValue({
      id: 'cfg-1',
      profileId: 'prof-1',
      name: 'API Pagamentos',
      url: 'https://api.pagamentos.com',
      httpMethod: HealthCheckHttpMethod.GET,
      endpoint: '/health',
      authKey: 'Authorization',
      authValue: 'enc:Bearer secret',
      alertMessage: 'Falha ${error_code}',
    });

    await service.create('prof-1', {
      name: 'API Pagamentos',
      url: 'https://api.pagamentos.com',
      httpMethod: HealthCheckHttpMethod.GET,
      endpoint: '/health',
      authKey: 'Authorization',
      authValue: 'Bearer secret',
      alertMessage: 'Falha ${error_code}',
    });

    expect(cryptoService.encrypt).toHaveBeenCalledWith('Bearer secret');
    expect(prisma.healthCheckConfig.create).toHaveBeenCalledWith({
      data: {
        profileId: 'prof-1',
        name: 'API Pagamentos',
        url: 'https://api.pagamentos.com',
        httpMethod: HealthCheckHttpMethod.GET,
        endpoint: '/health',
        authKey: 'Authorization',
        authValue: 'enc:Bearer secret',
        alertMessage: 'Falha ${error_code}',
      },
    });
    expect(redisClient.del).toHaveBeenCalledWith(HEALTH_CHECK_CACHE_KEY);
  });

  it('rejects create when authKey is provided without authValue', async () => {
    await expect(
      service.create('prof-1', {
        name: 'API',
        url: 'https://api.com',
        httpMethod: HealthCheckHttpMethod.GET,
        authKey: 'Authorization',
        alertMessage: 'Erro',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('invalidates Redis cache on update and remove', async () => {
    const existing = {
      id: 'cfg-1',
      profileId: 'prof-1',
      name: 'API',
      url: 'https://api.com',
      httpMethod: HealthCheckHttpMethod.GET,
      endpoint: '/health',
      authKey: null,
      authValue: null,
      alertMessage: 'Erro',
    };
    prisma.healthCheckConfig.findFirst.mockResolvedValue(existing);
    prisma.healthCheckConfig.update.mockResolvedValue({
      ...existing,
      name: 'API 2',
    });
    prisma.healthCheckConfig.delete.mockResolvedValue(existing);

    await service.update('prof-1', 'cfg-1', { name: 'API 2' });
    expect(redisClient.del).toHaveBeenCalledWith(HEALTH_CHECK_CACHE_KEY);

    redisClient.del.mockClear();
    await service.remove('prof-1', 'cfg-1');
    expect(redisClient.del).toHaveBeenCalledWith(HEALTH_CHECK_CACHE_KEY);
  });

  it('throws NotFoundException when updating a config from another profile', async () => {
    prisma.healthCheckConfig.findFirst.mockResolvedValue(null);

    await expect(
      service.update('prof-1', 'cfg-other', { name: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('populates Redis cache for 3 days when cache is expired/missing', async () => {
    redisClient.get.mockResolvedValue(null);
    const dbRecords = [
      {
        id: 'cfg-1',
        profileId: 'prof-1',
        name: 'API',
        url: 'https://api.com',
        httpMethod: HealthCheckHttpMethod.GET,
        endpoint: '/health',
        authKey: null,
        authValue: null,
        alertMessage: 'Erro',
        profile: {
          id: 'prof-1',
          name: 'Igor',
          jid: '5511999999999@s.whatsapp.net',
          timezone: 'America/Sao_Paulo',
          active: true,
        },
      },
    ];
    prisma.healthCheckConfig.findMany.mockResolvedValue(dbRecords);

    const result = await service.getConfigsForExecution();

    expect(result).toHaveLength(1);
    expect(redisClient.set).toHaveBeenCalledWith(
      HEALTH_CHECK_CACHE_KEY,
      JSON.stringify(dbRecords),
      {
        expiration: { type: 'EX', value: HEALTH_CHECK_CACHE_TTL_SECONDS },
      },
    );
  });
});

