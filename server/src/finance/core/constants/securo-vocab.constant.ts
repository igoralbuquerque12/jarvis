export const SECURO_TRANSACTION_TYPES = ['debit', 'credit'] as const;

export const SECURO_ACCOUNT_TYPES = [
  'checking',
  'savings',
  'credit_card',
  'investment',
  'wallet',
] as const;

export const SECURO_RECURRENCE_FREQUENCIES = [
  'weekly',
  'monthly',
  'quarterly',
  'yearly',
] as const;

export const SECURO_ASSET_TYPES = [
  'stock',
  'etf',
  'crypto',
  'fund',
  'real_estate',
  'vehicle',
  'valuable',
  'investment',
  'other',
] as const;

export const SECURO_ASSET_TRADE_KINDS = ['buy', 'sell'] as const;

export const SECURO_GOAL_STATUSES = [
  'active',
  'completed',
  'paused',
  'archived',
] as const;

export const SECURO_RULE_FIELDS = [
  'description',
  'notes',
  'amount',
  'type',
  'account_id',
  'payee_id',
  'date',
] as const;

export const SECURO_RULE_OPS = [
  'contains',
  'not_contains',
  'equals',
  'not_equals',
  'starts_with',
  'ends_with',
  'regex',
  'gt',
  'gte',
  'lt',
  'lte',
] as const;

export const SECURO_RULE_ACTION_OPS = [
  'set_category',
  'set_payee',
  'append_notes',
  'ignore',
] as const;

export const SECURO_RULE_CONDITIONS_OPS = ['and', 'or'] as const;

export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
