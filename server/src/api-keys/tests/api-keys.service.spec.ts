import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { ApiKey, Profile } from '@prisma/client';
import { PrismaService } from '../../prisma/services/prisma.service';
import { MAX_API_KEYS_PER_PROFILE } from '../constants/api-keys.constant';
import { ApiKeysService } from '../services/api-keys.service';
import { generateApiKey, hashApiKey } from '../utils/generate-api-key';

const profileId = '11111111-1111-4111-8111-111111111111';

function buildProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: profileId,
    userId: 'user-1',
    name: 'Igor',
    token: 'ABCDEFGHIJ',
    jid: '5511999999999@s.whatsapp.net',
    about: '',
    timezone: 'America/Sao_Paulo',
    active: true,
    subscriptionId: '22222222-2222-4222-8222-222222222222',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

function buildApiKey(overrides: Partial<ApiKey> = {}): ApiKey {
  return {
    id: '33333333-3333-4333-8333-333333333333',
    profileId,
    name: 'n8n',
    prefix: 'jrv_abcdefgh',
    hash: 'hash',
    active: true,
    lastUsedAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

function createPrismaMock() {
  return {
    apiKey: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
}

describe('ApiKeysService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: ApiKeysService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new ApiKeysService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('stores only the hash and returns the secret once', async () => {
      prisma.apiKey.count.mockResolvedValue(0);
      prisma.apiKey.create.mockImplementation(
        ({ data }: { data: Partial<ApiKey> }) =>
          Promise.resolve(buildApiKey(data)),
      );

      const created = await service.create(profileId, { name: '  n8n  ' });

      const [[createArgs]] = prisma.apiKey.create.mock.calls as [
        [{ data: ApiKey }],
      ];
      const stored = createArgs.data;
      expect(stored.name).toBe('n8n');
      expect(stored.hash).toBe(hashApiKey(created.secret));
      expect(stored.prefix).toBe(created.secret.slice(0, 12));
      expect(stored).not.toHaveProperty('secret');
      expect(created).not.toHaveProperty('hash');
    });

    it('rejects when the profile reached the key limit', async () => {
      prisma.apiKey.count.mockResolvedValue(MAX_API_KEYS_PER_PROFILE);

      await expect(service.create(profileId, { name: 'x' })).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.apiKey.create).not.toHaveBeenCalled();
    });
  });

  describe('update / remove', () => {
    it('only touches keys owned by the profile', async () => {
      prisma.apiKey.findFirst.mockResolvedValue(null);

      await expect(
        service.update(profileId, 'other-id', { active: false }),
      ).rejects.toThrow(NotFoundException);
      await expect(service.remove(profileId, 'other-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.apiKey.findFirst).toHaveBeenCalledWith({
        where: { id: 'other-id', profileId },
      });
    });

    it('updates name and active flag', async () => {
      const apiKey = buildApiKey();
      prisma.apiKey.findFirst.mockResolvedValue(apiKey);
      prisma.apiKey.update.mockResolvedValue(
        buildApiKey({ name: 'Zapier', active: false }),
      );

      await service.update(profileId, apiKey.id, {
        name: ' Zapier ',
        active: false,
      });

      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: apiKey.id },
        data: { name: 'Zapier', active: false },
      });
    });
  });

  describe('verify', () => {
    it('resolves an active key to its profile', async () => {
      const { secret, hash } = generateApiKey();
      const apiKey = { ...buildApiKey({ hash }), profile: buildProfile() };
      prisma.apiKey.findUnique.mockResolvedValue(apiKey);

      await expect(service.verify(secret)).resolves.toBe(apiKey);
      expect(prisma.apiKey.findUnique).toHaveBeenCalledWith({
        where: { hash },
        include: { profile: true },
      });
    });

    it('returns null for malformed secrets without hitting the database', async () => {
      await expect(service.verify('not-a-key')).resolves.toBeNull();
      expect(prisma.apiKey.findUnique).not.toHaveBeenCalled();
    });

    it('returns null for unknown, inactive keys or inactive profiles', async () => {
      const { secret } = generateApiKey();

      prisma.apiKey.findUnique.mockResolvedValueOnce(null);
      await expect(service.verify(secret)).resolves.toBeNull();

      prisma.apiKey.findUnique.mockResolvedValueOnce({
        ...buildApiKey({ active: false }),
        profile: buildProfile(),
      });
      await expect(service.verify(secret)).resolves.toBeNull();

      prisma.apiKey.findUnique.mockResolvedValueOnce({
        ...buildApiKey(),
        profile: buildProfile({ active: false }),
      });
      await expect(service.verify(secret)).resolves.toBeNull();
    });
  });

  describe('touchLastUsed', () => {
    it('swallows database errors', () => {
      prisma.apiKey.update.mockRejectedValue(new Error('db down'));

      expect(() => service.touchLastUsed('id')).not.toThrow();
    });
  });
});
