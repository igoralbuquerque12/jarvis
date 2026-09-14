export interface ProfileSubscription {
  id: string;
  name: string;
  price: number;
  limit: number;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  limit: number;
}

export interface ProfileMe {
  name: string;
  about: string;
  timezone: string;
  token: string;
  whatsappLinked: boolean;
  whatsappNumber: string | null;
  subscription: ProfileSubscription;
  createdAt: string;
}

export type EventSeriesType = 'UNIQUE' | 'RECURRENCE';

export type RecurrenceMode = 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';

export type EventExecutionStatus = 'PENDING' | 'PROCESSING';

export interface UpcomingEvent {
  id: string;
  content: string;
  scheduledAt: string;
  status: EventExecutionStatus;
  series: {
    id: string;
    type: EventSeriesType;
    recurrenceInterval: number | null;
    recurrenceMode: RecurrenceMode | null;
  };
}

// ── Finance ──────────────────────────────────────────────────────────────────

export interface FinanceAccount {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: number;
  institution?: string;
  color?: string;
  icon?: string;
  isDefault: boolean;
  createdAt: string;
}

export type TransactionType = 'debit' | 'credit';

export interface FinanceCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  date: string;
  notes?: string;
  currency: string;
  category?: FinanceCategory;
  account?: FinanceAccount;
  createdAt: string;
}

export interface TransactionSummary {
  income: number;
  expense: number;
  net: number;
}

export interface TransactionPage {
  items: Transaction[];
  total: number;
  page: number;
  limit: number;
  summary: TransactionSummary;
}

export interface Rule {
  id: string;
  name: string;
  priority: number;
  conditions: RuleCondition[];
  actions: RuleAction[];
  isActive: boolean;
  createdAt: string;
}

export interface RuleCondition {
  field: string;
  operator: string;
  value: string;
}

export interface RuleAction {
  type: string;
  categoryId?: string;
  value?: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  targetDate?: string;
  icon?: string;
  color?: string;
  createdAt: string;
}

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  frequency: RecurringFrequency;
  dayOfMonth?: number;
  dayOfWeek?: number;
  currency: string;
  category?: FinanceCategory;
  account?: FinanceAccount;
  nextDueDate?: string;
  isActive: boolean;
  createdAt: string;
}

export type AssetType = 'stock' | 'crypto' | 'real_estate' | 'fixed_income' | 'other';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  currency: string;
  currentValue?: number;
  purchaseDate?: string;
  purchasePrice?: number;
  ticker?: string;
  units?: number;
  averagePrice?: number;
  totalCost?: number;
  realizedGain?: number;
  createdAt: string;
}

export type AssetTradeType = 'buy' | 'sell';

export interface AssetTrade {
  id: string;
  assetId: string;
  type: AssetTradeType;
  units: number;
  price: number;
  date: string;
  createdAt: string;
}

// ── API keys ─────────────────────────────────────────────────────────────────

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  active: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

/** Returned only once, right after creation. */
export interface CreatedApiKey extends ApiKey {
  secret: string;
}
