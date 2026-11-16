import {
  CategoryView,
  SecuroCategory,
  toCategoryView,
} from '../../categories/entities/category.view';
import {
  optional,
  SecuroNumeric,
  toNumber,
} from '../../core/utils/securo-value.util';

/** `TransactionRead` as returned by Securo's `/api/transactions`. */
export interface SecuroTransaction {
  id: string;
  description: string;
  amount: SecuroNumeric;
  type: string;
  date: string;
  currency: string;
  notes?: string | null;
  account_id?: string | null;
  category_id?: string | null;
  category?: SecuroCategory | null;
}

/** `PaginatedTransactions` as returned by Securo's `GET /api/transactions`. */
export interface SecuroTransactionPage {
  items: SecuroTransaction[];
  total: number;
  page: number;
  limit: number;
  summary?: {
    income: SecuroNumeric;
    expense: SecuroNumeric;
    net: SecuroNumeric;
  } | null;
}

export interface TransactionView {
  id: string;
  description: string;
  amount: number;
  type: string;
  date: string;
  currency: string;
  notes?: string;
  accountId?: string;
  categoryId?: string;
  category?: CategoryView;
}

export interface TransactionPageView {
  items: TransactionView[];
  total: number;
  page: number;
  limit: number;
  summary: { income: number; expense: number; net: number };
}

export function toTransactionView(
  transaction: SecuroTransaction,
): TransactionView {
  return {
    id: transaction.id,
    description: transaction.description,
    amount: toNumber(transaction.amount),
    type: transaction.type,
    date: transaction.date,
    currency: transaction.currency,
    notes: optional(transaction.notes),
    accountId: optional(transaction.account_id),
    categoryId: optional(transaction.category_id),
    category: transaction.category
      ? toCategoryView(transaction.category)
      : undefined,
  };
}

export function toTransactionPageView(
  page: SecuroTransactionPage,
): TransactionPageView {
  return {
    items: page.items.map(toTransactionView),
    total: page.total,
    page: page.page,
    limit: page.limit,
    summary: {
      income: toNumber(page.summary?.income),
      expense: toNumber(page.summary?.expense),
      net: toNumber(page.summary?.net),
    },
  };
}
