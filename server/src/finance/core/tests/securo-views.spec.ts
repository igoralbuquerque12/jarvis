import { toAccountView } from '../../accounts/entities/account.view';
import { toAssetView } from '../../assets/entities/asset.view';
import { toGoalView } from '../../goals/entities/goal.view';
import { toRecurringTransactionView } from '../../recurring-transactions/entities/recurring-transaction.view';
import { toTransactionPageView } from '../../transactions/entities/transaction.view';
import { toNumber, toOptionalNumber } from '../utils/securo-value.util';

describe('Securo response views', () => {
  describe('securo-value util', () => {
    it('parses Decimal strings and plain numbers', () => {
      expect(toNumber('1200.50')).toBe(1200.5);
      expect(toNumber(42)).toBe(42);
    });

    it('falls back to 0 / undefined for absent or invalid values', () => {
      expect(toNumber(null)).toBe(0);
      expect(toNumber('abc')).toBe(0);
      expect(toOptionalNumber(null)).toBeUndefined();
      expect(toOptionalNumber('')).toBeUndefined();
    });
  });

  it('maps a goal to camelCase with numeric amounts', () => {
    const view = toGoalView({
      id: 'goal-1',
      name: 'Viagem',
      target_amount: '5000.00',
      current_amount: '1250.00',
      currency: 'BRL',
      target_date: null,
      status: 'active',
      icon: null,
      color: '#fff',
      percentage: 25,
      created_at: '2026-11-01T10:00:00Z',
    });

    expect(view).toEqual({
      id: 'goal-1',
      name: 'Viagem',
      targetAmount: 5000,
      currentAmount: 1250,
      currency: 'BRL',
      targetDate: undefined,
      status: 'active',
      icon: undefined,
      color: '#fff',
      percentage: 25,
      createdAt: '2026-11-01T10:00:00Z',
    });
  });

  it('uses the current balance and flags the default account', () => {
    const account = {
      id: 'account-1',
      name: 'Carteira',
      display_name: null,
      type: 'checking',
      currency: 'BRL',
      balance: '100.00',
      current_balance: 350.75,
      institution_name: null,
    };

    expect(toAccountView(account, 'account-1')).toMatchObject({
      balance: 350.75,
      isDefault: true,
    });
    expect(toAccountView(account, 'other').isDefault).toBe(false);
  });

  it('maps the transaction page, nested category and summary', () => {
    const view = toTransactionPageView({
      items: [
        {
          id: 'tx-1',
          description: 'Mercado',
          amount: '89.90',
          type: 'debit',
          date: '2026-11-10',
          currency: 'BRL',
          notes: null,
          account_id: 'account-1',
          category_id: 'cat-1',
          category: {
            id: 'cat-1',
            name: 'Mercado',
            icon: '🛒',
            color: null,
            is_system: true,
          },
        },
      ],
      total: 1,
      page: 1,
      limit: 50,
      summary: null,
    });

    expect(view.items[0]).toMatchObject({
      amount: 89.9,
      accountId: 'account-1',
      categoryId: 'cat-1',
      category: { id: 'cat-1', name: 'Mercado', isDefault: true },
    });
    expect(view.summary).toEqual({ income: 0, expense: 0, net: 0 });
  });

  it('maps recurring transactions and assets', () => {
    expect(
      toRecurringTransactionView({
        id: 'rec-1',
        description: 'Aluguel',
        amount: '1500.00',
        currency: 'BRL',
        type: 'debit',
        frequency: 'monthly',
        day_of_month: 5,
        start_date: '2026-11-05',
        end_date: null,
        next_occurrence: '2026-12-05',
        is_active: true,
      }),
    ).toMatchObject({ amount: 1500, dayOfMonth: 5, nextDueDate: '2026-12-05' });

    expect(
      toAssetView({
        id: 'asset-1',
        name: 'PETR4',
        type: 'stock',
        currency: 'BRL',
        units: 10,
        current_value: 380.5,
        total_invested: 350,
        purchase_price: null,
      }),
    ).toMatchObject({
      units: 10,
      currentValue: 380.5,
      totalCost: 350,
      purchasePrice: undefined,
    });
  });
});
