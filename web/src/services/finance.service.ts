import { apiFetch } from '../lib/api';
import type {
  Asset,
  AssetTrade,
  FinanceAccount,
  FinanceCategory,
  Goal,
  RecurringTransaction,
  Rule,
  TransactionPage,
} from '../types/api';

// ── Accounts ──────────────────────────────────────────────────────────────────

export function getMyAccounts(): Promise<FinanceAccount[]> {
  return apiFetch<FinanceAccount[]>('/finance/me/accounts');
}

export function createMyAccount(data: {
  name: string;
  type: string;
  currency?: string;
  institution?: string;
  balance?: number;
}): Promise<FinanceAccount> {
  return apiFetch<FinanceAccount>('/finance/me/accounts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ── Transactions ──────────────────────────────────────────────────────────────

export interface FindTransactionsParams {
  from?: string;
  to?: string;
  type?: 'debit' | 'credit';
  accountId?: string;
  categoryId?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export function getMyTransactions(
  params: FindTransactionsParams = {},
): Promise<TransactionPage> {
  const qs = new URLSearchParams();
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);
  if (params.type) qs.set('type', params.type);
  if (params.accountId) qs.set('accountId', params.accountId);
  if (params.categoryId) qs.set('categoryId', params.categoryId);
  if (params.q) qs.set('q', params.q);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));

  const query = qs.toString();
  return apiFetch<TransactionPage>(
    `/finance/me/transactions${query ? `?${query}` : ''}`,
  );
}

export function createMyTransaction(data: {
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  date: string;
  accountId?: string;
  categoryId?: string;
  notes?: string;
  currency?: string;
}): Promise<unknown> {
  return apiFetch('/finance/me/transactions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateMyTransaction(
  id: string,
  data: Partial<{
    description: string;
    amount: number;
    type: 'debit' | 'credit';
    date: string;
    accountId: string;
    categoryId: string;
    notes: string;
  }>,
): Promise<unknown> {
  return apiFetch(`/finance/me/transactions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteMyTransaction(id: string): Promise<unknown> {
  return apiFetch(`/finance/me/transactions/${id}`, { method: 'DELETE' });
}

// ── Categories ────────────────────────────────────────────────────────────────

export function getMyCategories(): Promise<FinanceCategory[]> {
  return apiFetch<FinanceCategory[]>('/finance/me/categories');
}

export function createMyCategory(data: {
  name: string;
  icon?: string;
  color?: string;
}): Promise<FinanceCategory> {
  return apiFetch<FinanceCategory>('/finance/me/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateMyCategory(
  id: string,
  data: Partial<{ name: string; icon: string; color: string }>,
): Promise<FinanceCategory> {
  return apiFetch<FinanceCategory>(`/finance/me/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteMyCategory(id: string): Promise<unknown> {
  return apiFetch(`/finance/me/categories/${id}`, { method: 'DELETE' });
}

// ── Rules ─────────────────────────────────────────────────────────────────────

export function getMyRules(): Promise<Rule[]> {
  return apiFetch<Rule[]>('/finance/me/rules');
}

export function deleteMyRule(id: string): Promise<unknown> {
  return apiFetch(`/finance/me/rules/${id}`, { method: 'DELETE' });
}

// ── Goals ─────────────────────────────────────────────────────────────────────

export function getMyGoals(): Promise<Goal[]> {
  return apiFetch<Goal[]>('/finance/me/goals');
}

export function createMyGoal(data: {
  name: string;
  targetAmount: number;
  currentAmount?: number;
  currency?: string;
  targetDate?: string;
  icon?: string;
  color?: string;
}): Promise<Goal> {
  return apiFetch<Goal>('/finance/me/goals', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateMyGoal(
  id: string,
  data: Partial<{
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string;
    icon: string;
    color: string;
  }>,
): Promise<Goal> {
  return apiFetch<Goal>(`/finance/me/goals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteMyGoal(id: string): Promise<unknown> {
  return apiFetch(`/finance/me/goals/${id}`, { method: 'DELETE' });
}

// ── Recurring Transactions ────────────────────────────────────────────────────

export function getMyRecurring(): Promise<RecurringTransaction[]> {
  return apiFetch<RecurringTransaction[]>('/finance/me/recurring-transactions');
}

export function createMyRecurring(data: {
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  frequency: string;
  dayOfMonth?: number;
  dayOfWeek?: number;
  currency?: string;
  categoryId?: string;
  accountId?: string;
}): Promise<RecurringTransaction> {
  return apiFetch<RecurringTransaction>('/finance/me/recurring-transactions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deleteMyRecurring(id: string): Promise<unknown> {
  return apiFetch(`/finance/me/recurring-transactions/${id}`, {
    method: 'DELETE',
  });
}

// ── Assets ────────────────────────────────────────────────────────────────────

export function getMyAssets(): Promise<Asset[]> {
  return apiFetch<Asset[]>('/finance/me/assets');
}

export function createMyAsset(data: {
  name: string;
  type: string;
  currency?: string;
  currentValue?: number;
  purchaseDate?: string;
  purchasePrice?: number;
  ticker?: string;
  units?: number;
}): Promise<Asset> {
  return apiFetch<Asset>('/finance/me/assets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deleteMyAsset(id: string): Promise<unknown> {
  return apiFetch(`/finance/me/assets/${id}`, { method: 'DELETE' });
}

export function getMyAssetTrades(assetId: string): Promise<AssetTrade[]> {
  return apiFetch<AssetTrade[]>(`/finance/me/assets/${assetId}/trades`);
}

export function createMyAssetTrade(
  assetId: string,
  data: { type: 'buy' | 'sell'; units: number; price: number; date: string },
): Promise<AssetTrade> {
  return apiFetch<AssetTrade>(`/finance/me/assets/${assetId}/trades`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
