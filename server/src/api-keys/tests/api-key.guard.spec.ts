import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { PublicApiController } from '../../public-api/controllers/public-api.controller';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { ApiKeysService } from '../services/api-keys.service';

function createContext(headers: Record<string, string>) {
  const request: Record<string, unknown> = { headers };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;

  return { context, request };
}

describe('ApiKeyGuard', () => {
  const profile = { id: 'profile-1', active: true };
  let apiKeysService: { verify: jest.Mock; touchLastUsed: jest.Mock };
  let guard: ApiKeyGuard;

  beforeEach(() => {
    apiKeysService = { verify: jest.fn(), touchLastUsed: jest.fn() };
    guard = new ApiKeyGuard(apiKeysService as unknown as ApiKeysService);
  });

  it('rejects requests without a key', async () => {
    const { context } = createContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(apiKeysService.verify).not.toHaveBeenCalled();
  });

  it('rejects unknown keys', async () => {
    apiKeysService.verify.mockResolvedValue(null);
    const { context } = createContext({ authorization: 'Bearer jrv_nope' });

    await expect(guard.canActivate(context)).rejects.toThrow(
      'Chave de API inválida ou inativa.',
    );
  });

  it('attaches the owner profile and records usage on success', async () => {
    apiKeysService.verify.mockResolvedValue({ id: 'key-1', profile });
    const { context, request } = createContext({ 'x-api-key': 'jrv_ok' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(apiKeysService.verify).toHaveBeenCalledWith('jrv_ok');
    expect(apiKeysService.touchLastUsed).toHaveBeenCalledWith('key-1');
    expect(request.apiKeyProfile).toBe(profile);
    expect(request.apiKeyId).toBe('key-1');
  });

  it('is applied to the public API controller', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      PublicApiController,
    ) as unknown[];

    expect(guards).toContain(ApiKeyGuard);
  });
});
