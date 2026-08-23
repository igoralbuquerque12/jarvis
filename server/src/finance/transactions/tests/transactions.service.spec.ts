import { TransactionsService } from '../services/transactions.service';

describe('TransactionsService', () => {
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

  const service = new TransactionsService(
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

  it('creates transactions on the default account with money as strings', async () => {
    securoApi.request.mockResolvedValue({ id: 'tx-1' });

    await service.createTransaction('profile-1', {
      description: 'Mercado',
      amount: 50.5,
      type: 'debit',
      date: '2026-08-13',
    });

    expect(securoApi.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/api/transactions',
      token: 'user-token',
      workspaceId: 'workspace-1',
      body: {
        description: 'Mercado',
        amount: '50.50',
        date: '2026-08-13',
        type: 'debit',
        account_id: 'account-1',
      },
    });
  });

  it('keeps an explicit accountId instead of the default account', async () => {
    securoApi.request.mockResolvedValue({ id: 'tx-1' });

    await service.createTransaction('profile-1', {
      description: 'Freela',
      amount: 200,
      type: 'credit',
      date: '2026-08-13',
      accountId: 'account-2',
    });

    expect(securoApi.request).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({ account_id: 'account-2' }) as object,
      }),
    );
  });

  it('maps transaction filters to the Securo query names', async () => {
    securoApi.request.mockResolvedValue({ items: [] });

    await service.findTransactions('profile-1', {
      from: '2026-08-01',
      to: '2026-08-31',
      type: 'debit',
      categoryId: 'category-1',
      limit: 10,
    });

    expect(securoApi.request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/api/transactions',
      token: 'user-token',
      workspaceId: 'workspace-1',
      query: {
        from: '2026-08-01',
        to: '2026-08-31',
        type: 'debit',
        category_id: 'category-1',
        limit: 10,
      },
    });
  });

  it('confirms deletions with the removed id', async () => {
    securoApi.request.mockResolvedValue(undefined);

    await expect(
      service.removeTransaction('profile-1', 'tx-1'),
    ).resolves.toEqual({ deleted: true, transactionId: 'tx-1' });
  });
});
