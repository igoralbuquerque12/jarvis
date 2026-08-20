import { NotFoundException } from '@nestjs/common';

import { FinanceService } from './finance.service';

describe('FinanceService', () => {
  const profile = { id: 'profile-1', timezone: 'America/Sao_Paulo' };
  const securoAccount = {
    workspaceId: 'workspace-1',
    defaultAccountId: 'account-1',
  };

  const profileService = { findOne: jest.fn() };
  const securoApi = { request: jest.fn() };
  const securoProvisioning = {
    ensureSecuroAccount: jest.fn(),
    getUserToken: jest.fn(),
  };

  const service = new FinanceService(
    profileService as never,
    securoApi as never,
    securoProvisioning as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    profileService.findOne.mockResolvedValue(profile);
    securoProvisioning.ensureSecuroAccount.mockResolvedValue(securoAccount);
    securoProvisioning.getUserToken.mockResolvedValue('user-token');
  });

  it('rejects operations for unknown profiles', async () => {
    profileService.findOne.mockResolvedValue(null);

    await expect(
      service.findTransactions('missing-profile', {}),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(securoApi.request).not.toHaveBeenCalled();
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

  it('sends only the provided fields on updates', async () => {
    securoApi.request.mockResolvedValue({ id: 'goal-1' });

    await service.updateGoal('profile-1', 'goal-1', { currentAmount: 1500 });

    expect(securoApi.request).toHaveBeenCalledWith({
      method: 'PATCH',
      path: '/api/goals/goal-1',
      token: 'user-token',
      workspaceId: 'workspace-1',
      body: { current_amount: '1500.00' },
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
