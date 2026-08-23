import { RecurringTransactionsService } from '../services/recurring-transactions.service';

describe('RecurringTransactionsService', () => {
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

  const service = new RecurringTransactionsService(
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

  it('defaults recurring transactions to BRL and the default account', async () => {
    securoApi.request.mockResolvedValue({ id: 'rec-1' });

    await service.createRecurringTransaction('profile-1', {
      description: 'Salário',
      amount: 3000,
      type: 'credit',
      frequency: 'monthly',
      startDate: '2026-09-05',
      dayOfMonth: 5,
    });

    expect(securoApi.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/api/recurring-transactions',
      token: 'user-token',
      workspaceId: 'workspace-1',
      body: {
        description: 'Salário',
        amount: '3000.00',
        type: 'credit',
        frequency: 'monthly',
        start_date: '2026-09-05',
        day_of_month: 5,
        account_id: 'account-1',
        currency: 'BRL',
      },
    });
  });
});
