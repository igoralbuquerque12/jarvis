import { AssetsService } from '../services/assets.service';

describe('AssetsService', () => {
  const securoApi = { request: jest.fn() };
  const securoContext = {
    contextFor: jest.fn(),
    auth: jest.fn((ctx: { token: string; workspaceId: string }) => ({
      token: ctx.token,
      workspaceId: ctx.workspaceId,
    })),
    money: jest.fn((v: number | undefined) =>
      v === undefined ? undefined : v.toFixed(2),
    ),
    compact: jest.fn((payload: Record<string, unknown>) =>
      Object.fromEntries(
        Object.entries(payload).filter(([, v]) => v !== undefined),
      ),
    ),
  };

  const service = new AssetsService(securoApi as never, securoContext as never);

  beforeEach(() => {
    jest.clearAllMocks();
    securoContext.contextFor.mockResolvedValue({
      token: 'user-token',
      workspaceId: 'workspace-1',
      defaultAccountId: 'account-1',
    });
  });

  it('lists assets', async () => {
    securoApi.request.mockResolvedValue([{ id: 'asset-1', name: 'Tesouro' }]);

    const result = await service.findAssets('profile-1');

    expect(securoApi.request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/api/assets',
      token: 'user-token',
      workspaceId: 'workspace-1',
    });
    expect(result).toEqual([{ id: 'asset-1', name: 'Tesouro' }]);
  });

  it('creates asset', async () => {
    securoApi.request.mockResolvedValue({ id: 'asset-1' });

    await service.createAsset('profile-1', {
      name: 'Tesouro Selic',
      type: 'investment',
      currentValue: 10000,
    });

    expect(securoApi.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/api/assets',
      token: 'user-token',
      workspaceId: 'workspace-1',
      body: {
        name: 'Tesouro Selic',
        type: 'investment',
        current_value: '10000.00',
        currency: 'BRL',
      },
    });
  });
});
