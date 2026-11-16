import {
  optional,
  SecuroNumeric,
  toNumber,
} from '../../core/utils/securo-value.util';

/** `AccountRead` as returned by Securo's `/api/accounts`. */
export interface SecuroAccount {
  id: string;
  name: string;
  display_name?: string | null;
  type: string;
  currency: string;
  balance: SecuroNumeric;
  current_balance?: number | null;
  institution_name?: string | null;
}

export interface AccountView {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: number;
  institution?: string;
  isDefault: boolean;
}

/**
 * `current_balance` is the balance with every transaction applied; `balance`
 * is only the opening balance typed on creation.
 */
export function toAccountView(
  account: SecuroAccount,
  defaultAccountId?: string,
): AccountView {
  return {
    id: account.id,
    name: account.display_name || account.name,
    type: account.type,
    currency: account.currency,
    balance: toNumber(account.current_balance ?? account.balance),
    institution: optional(account.institution_name),
    isDefault: account.id === defaultAccountId,
  };
}
