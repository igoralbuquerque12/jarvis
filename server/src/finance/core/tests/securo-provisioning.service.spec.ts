import { SecuroAccountStatus } from '@prisma/client';

import { SecuroProvisioningService } from '../services/securo-provisioning.service';

describe('SecuroProvisioningService', () => {
  const profile = { id: 'profile-1' };

  const prisma = {
    securoAccount: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  const securoApi = { request: jest.fn() };
  const redisClient = { get: jest.fn(), set: jest.fn() };
  const redisService = { getClient: () => redisClient };
  const configService = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        SECURO_PROVISION_SECRET: 'provision-secret',
        SECURO_ADMIN_EMAIL: 'admin@jarvis.internal',
        SECURO_ADMIN_PASSWORD: 'admin-password',
      };

      return values[key];
    }),
  };

  const service = new SecuroProvisioningService(
    prisma as never,
    securoApi as never,
    redisService as never,
    configService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    redisClient.get.mockResolvedValue(null);
    redisClient.set.mockResolvedValue('OK');
  });

  it('returns an already provisioned account without calling Securo', async () => {
    const active = {
      id: 'securo-account-1',
      status: SecuroAccountStatus.ACTIVE,
      workspaceId: 'workspace-1',
      defaultAccountId: 'account-1',
    };
    prisma.securoAccount.findUnique.mockResolvedValue(active);

    await expect(service.ensureSecuroAccount(profile as never)).resolves.toBe(
      active,
    );
    expect(securoApi.request).not.toHaveBeenCalled();
  });

  it('provisions a fresh profile end to end', async () => {
    prisma.securoAccount.findUnique.mockResolvedValue(null);
    prisma.securoAccount.create.mockResolvedValue({ id: 'securo-account-1' });
    prisma.securoAccount.update.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: 'securo-account-1', ...data }),
    );

    securoApi.request.mockImplementation(({ path }: { path: string }) => {
      switch (path) {
        case '/api/setup/status':
          return Promise.resolve({ has_users: true });
        case '/api/auth/login':
          return Promise.resolve({
            access_token: 'a-token',
            token_type: 'bearer',
          });
        case '/api/admin/users':
          return Promise.resolve({ id: 'securo-user-1', email: 'x@y.z' });
        case '/api/workspaces':
          return Promise.resolve([{ id: 'workspace-1', name: 'Pessoal' }]);
        case '/api/accounts':
          return Promise.resolve([{ id: 'account-1', name: 'Carteira' }]);
        default:
          return Promise.reject(new Error(`Unexpected path ${path}`));
      }
    });

    const result = await service.ensureSecuroAccount(profile as never);

    expect(result.status).toBe(SecuroAccountStatus.ACTIVE);
    expect(result.workspaceId).toBe('workspace-1');
    expect(result.defaultAccountId).toBe('account-1');

    expect(securoApi.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/admin/users',
        body: expect.objectContaining({
          email: 'profile-profile-1@jarvis.internal',
          preferences: { language: 'pt-BR', currency_display: 'BRL' },
        }) as object,
      }),
    );
  });

  it('marks the account as FAILED when provisioning breaks', async () => {
    prisma.securoAccount.findUnique.mockResolvedValue(null);
    prisma.securoAccount.create.mockResolvedValue({ id: 'securo-account-1' });
    prisma.securoAccount.update.mockResolvedValue({ id: 'securo-account-1' });
    securoApi.request.mockRejectedValue(new Error('Securo is down'));

    await expect(service.ensureSecuroAccount(profile as never)).rejects.toThrow(
      'Securo is down',
    );

    expect(prisma.securoAccount.update).toHaveBeenCalledWith({
      where: { id: 'securo-account-1' },
      data: {
        status: SecuroAccountStatus.FAILED,
        observabilitys: 'Securo is down',
      },
    });
  });

  it('reuses a cached user token without logging in again', async () => {
    redisClient.get.mockResolvedValue('cached-token');

    await expect(service.getUserToken(profile as never)).resolves.toBe(
      'cached-token',
    );
    expect(securoApi.request).not.toHaveBeenCalled();
  });
});
