import { FinanceToolService } from './finance-tool.service';

describe('FinanceToolService', () => {
  const profileId = '0f0c2b3e-8f7a-4d0e-9a3b-2c1d4e5f6a7b';
  const transactionId = 'c0a8012e-1111-4b2c-8d3e-4f5a6b7c8d9e';

  function makeHandler() {
    const transactions = {
      updateTransaction: jest.fn().mockResolvedValue({ id: transactionId }),
    };
    const accounts = { findAccounts: jest.fn().mockResolvedValue([]) };
    const unused = {};
    const handler = new FinanceToolService(
      accounts as never,
      unused as never,
      unused as never,
      unused as never,
      unused as never,
      unused as never,
      transactions as never,
    );

    return { handler, transactions, accounts };
  }

  it('lists accounts of the profile', async () => {
    const { handler, accounts } = makeHandler();

    await handler.execute(profileId, 'list_accounts', {});

    expect(accounts.findAccounts).toHaveBeenCalledWith(profileId);
  });

  it('passes the id separately and validates the rest of data', async () => {
    const { handler, transactions } = makeHandler();

    await handler.execute(profileId, 'update_transaction', {
      transactionId,
      amount: 55,
    });

    const [calledProfileId, calledId, dto] = transactions.updateTransaction.mock
      .calls[0] as [string, string, Record<string, unknown>];
    expect(calledProfileId).toBe(profileId);
    expect(calledId).toBe(transactionId);
    expect(dto).not.toHaveProperty('transactionId');
    expect(dto).toMatchObject({ amount: 55 });
  });

  it('rejects an unknown operation', async () => {
    const { handler } = makeHandler();

    await expect(
      handler.execute(profileId, 'create_event', {}),
    ).rejects.toMatchObject({
      response: { code: 'unsupported_operation' },
    });
  });
});
