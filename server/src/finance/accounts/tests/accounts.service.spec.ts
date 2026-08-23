import { AccountsService } from '../services/accounts.service';

describe('AccountsService', () => {
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

  const service = new AccountsService(
    securoApi as never,
    securoContext as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    securoContext.contextFor.mockResolvedValue({
      token: 'user-token',
      workspaceId: 'workspace-1',
      defaultAccountId: 'account-1',
    });
  });

  it('lists accounts for profile', async () => {
    securoApi.request.mockResolvedValue([{ id: 'account-1' }]);

    const result = await service.findAccounts('profile-1');

    expect(securoApi.request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/api/accounts',
      token: 'user-token',
      workspaceId: 'workspace-1',
    });
    expect(result).toEqual([{ id: 'account-1' }]);
  });

  it('creates an account with formatted balance and default currency', async () => {
    securoApi.request.mockResolvedValue({ id: 'account-2' });

    await service.createAccount('profile-1', {
      name: 'Nubank',
      type: 'checking',
      balance: 100.5,
    });

    expect(securoApi.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/api/accounts',
      token: 'user-token',
      workspaceId: 'workspace-1',
      body: {
        name: 'Nubank',
        type: 'checking',
        balance: '100.50',
        currency: 'BRL',
      },
    });
  });
});
