import {
  optional,
  SecuroNumeric,
  toNumber,
} from '../../core/utils/securo-value.util';

/** `RecurringTransactionRead` as returned by Securo's `/api/recurring-transactions`. */
export interface SecuroRecurringTransaction {
  id: string;
  description: string;
  amount: SecuroNumeric;
  currency: string;
  type: string;
  frequency: string;
  day_of_month?: number | null;
  start_date: string;
  end_date?: string | null;
  next_occurrence: string;
  is_active: boolean;
  account_id?: string | null;
  category_id?: string | null;
}

export interface RecurringTransactionView {
  id: string;
  description: string;
  amount: number;
  currency: string;
  type: string;
  frequency: string;
  dayOfMonth?: number;
  startDate: string;
  endDate?: string;
  nextDueDate: string;
  isActive: boolean;
  accountId?: string;
  categoryId?: string;
}

export function toRecurringTransactionView(
  recurring: SecuroRecurringTransaction,
): RecurringTransactionView {
  return {
    id: recurring.id,
    description: recurring.description,
    amount: toNumber(recurring.amount),
    currency: recurring.currency,
    type: recurring.type,
    frequency: recurring.frequency,
    dayOfMonth: optional(recurring.day_of_month),
    startDate: recurring.start_date,
    endDate: optional(recurring.end_date),
    nextDueDate: recurring.next_occurrence,
    isActive: recurring.is_active,
    accountId: optional(recurring.account_id),
    categoryId: optional(recurring.category_id),
  };
}
