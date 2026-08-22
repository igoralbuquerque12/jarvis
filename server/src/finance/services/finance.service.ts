import { Injectable, NotFoundException } from '@nestjs/common';

import { ProfileService } from '../../profile/profile.service';
import { FINANCE_DEFAULT_CURRENCY } from '../constants/finance-defaults.constant';
import { CreateAccountDto } from '../dto/create-account.dto';
import { CreateAssetDto } from '../dto/create-asset.dto';
import { CreateAssetTradeDto } from '../dto/create-asset-trade.dto';
import { CreateAssetValueDto } from '../dto/create-asset-value.dto';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { CreateGoalDto } from '../dto/create-goal.dto';
import { CreateRecurringTransactionDto } from '../dto/create-recurring-transaction.dto';
import { CreateRuleDto } from '../dto/create-rule.dto';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { FindGoalsDto } from '../dto/find-goals.dto';
import { FindTransactionsDto } from '../dto/find-transactions.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { UpdateGoalDto } from '../dto/update-goal.dto';
import { UpdateRecurringTransactionDto } from '../dto/update-recurring-transaction.dto';
import { UpdateRuleDto } from '../dto/update-rule.dto';
import { UpdateTransactionDto } from '../dto/update-transaction.dto';
import { SecuroApiService } from './securo-api.service';
import { SecuroProvisioningService } from './securo-provisioning.service';

type SecuroContext = {
  token: string;
  workspaceId: string;
  defaultAccountId: string;
};

@Injectable()
export class FinanceService {
  constructor(
    private readonly profileService: ProfileService,
    private readonly securoApi: SecuroApiService,
    private readonly securoProvisioning: SecuroProvisioningService,
  ) {}

  // Accounts

  async findAccounts(profileId: string) {
    const context = await this.contextFor(profileId);

    return this.securoApi.request({
      method: 'GET',
      path: '/api/accounts',
      ...this.auth(context),
    });
  }

  async createAccount(profileId: string, data: CreateAccountDto) {
    const context = await this.contextFor(profileId);

    return this.securoApi.request({
      method: 'POST',
      path: '/api/accounts',
      ...this.auth(context),
      body: this.compact({
        name: data.name,
        type: data.type,
        balance: this.money(data.balance),
        currency: data.currency ?? FINANCE_DEFAULT_CURRENCY,
      }),
    });
  }

  // Transactions

  async createTransaction(profileId: string, data: CreateTransactionDto) {
    const context = await this.contextFor(profileId);

    return this.securoApi.request({
      method: 'POST',
      path: '/api/transactions',
      ...this.auth(context),
      body: this.compact({
        description: data.description,
        amount: this.money(data.amount),
        date: data.date,
        type: data.type,
        account_id: data.accountId ?? context.defaultAccountId,
        category_id: data.categoryId,
        notes: data.notes,
        currency: data.currency,
      }),
    });
  }

  async findTransactions(profileId: string, filters: FindTransactionsDto) {
    const context = await this.contextFor(profileId);

    return this.securoApi.request({
      method: 'GET',
      path: '/api/transactions',
      ...this.auth(context),
      query: this.compact({
        from: filters.from,
        to: filters.to,
        type: filters.type,
        account_id: filters.accountId,
        category_id: filters.categoryId,
        q: filters.q,
        page: filters.page,
        limit: filters.limit,
      }),
    });
  }

  async updateTransaction(
    profileId: string,
    transactionId: string,
    data: UpdateTransactionDto,
  ) {
    const context = await this.contextFor(profileId);

    return this.securoApi.request({
      method: 'PATCH',
      path: `/api/transactions/${transactionId}`,
      ...this.auth(context),
      body: this.compact({
        description: data.description,
        amount: this.money(data.amount),
        date: data.date,
        type: data.type,
        account_id: data.accountId,
        category_id: data.categoryId,
        notes: data.notes,
      }),
    });
  }

  async removeTransaction(profileId: string, transactionId: string) {
    const context = await this.contextFor(profileId);

    await this.securoApi.request({
      method: 'DELETE',
      path: `/api/transactions/${transactionId}`,
      ...this.auth(context),
    });

    return { deleted: true, transactionId };
  }

  // Categories

  async findCategories(profileId: string) {
    const context = await this.contextFor(profileId);

    return this.securoApi.request({
      method: 'GET',
      path: '/api/categories',
      ...this.auth(context),
    });
  }

  async createCategory(profileId: string, data: CreateCategoryDto) {
    const context = await this.contextFor(profileId);

    return this.securoApi.request({
      method: 'POST',
      path: '/api/categories',
      ...this.auth(context),
      body: this.compact({
        name: data.name,
        icon: data.icon,
        color: data.color,
      }),
    });
  }

  async updateCategory(
    profileId: string,
    categoryId: string,
    data: UpdateCategoryDto,
  ) {
    const context = await this.contextFor(profileId);

    return this.securoApi.request({
      method: 'PATCH',
      path: `/api/categories/${categoryId}`,
      ...this.auth(context),
      body: this.compact({
        name: data.name,
        icon: data.icon,
        color: data.color,
      }),
    });
  }

  async removeCategory(profileId: string, categoryId: string) {
    const context = await this.contextFor(profileId);

    await this.securoApi.request({
      method: 'DELETE',
      path: `/api/categories/${categoryId}`,
      ...this.auth(context),
    });

    return { deleted: true, categoryId };
  }

  // Rules

  async findRules(profileId: string) {
    const context = await this.contextFor(profileId);

    return this.securoApi.request({
      method: 'GET',
      path: '/api/rules',
      ...this.auth(context),
    });
  }

  async createRule(profileId: string, data: CreateRuleDto) {
    const context = await this.contextFor(profileId);

    return this.securoApi.request({
      method: 'POST',
      path: '/api/rules',
      ...this.auth(context),
      body: this.compact({
        name: data.name,
        conditions: data.conditions,
        actions: data.actions,
        conditions_op: data.conditionsOp,
        priority: data.priority,
        is_active: data.isActive,
        apply_to_existing: data.applyToExisting,
        overwrite_existing_categories: data.overwriteExistingCategories,
      }),
    });
  }

  async updateRule(profileId: string, ruleId: string, data: UpdateRuleDto) {
    const context = await this.contextFor(profileId);

    return this.securoApi.request({
      method: 'PATCH',
      path: `/api/rules/${ruleId}`,
      ...this.auth(context),
      body: this.compact({
        name: data.name,
        conditions: data.conditions,
        actions: data.actions,
        conditions_op: data.conditionsOp,
        priority: data.priority,
        is_active: data.isActive,
      }),
    });
  }

  async removeRule(profileId: string, ruleId: string) {
    const context = await this.contextFor(profileId);

    await this.securoApi.request({
      method: 'DELETE',
      path: `/api/rules/${ruleId}`,
      ...this.auth(context),
    });

    return { deleted: true, ruleId };
  }

  // Goals

  async findGoals(profileId: string, filters: FindGoalsDto) {
    const context = await this.contextFor(profileId);

    return this.securoApi.request({
      method: 'GET',
      path: '/api/goals',
      ...this.auth(context),
      query: this.compact({ status: filters.status }),
    });
  }

  async createGoal(profileId: string, data: CreateGoalDto) {
    const context = await this.contextFor(profileId);

    return this.securoApi.request({
      method: 'POST',
      path: '/api/goals',
      ...this.auth(context),
      body: this.compact({
        name: data.name,
        target_amount: this.money(data.targetAmount),
        current_amount: this.money(data.currentAmount),
        currency: data.currency ?? FINANCE_DEFAULT_CURRENCY,
        target_date: data.targetDate,
        tracking_type: 'manual',
        icon: data.icon,
        color: data.color,
      }),
    });
  }

  async updateGoal(profileId: string, goalId: string, data: UpdateGoalDto) {
    const context = await this.contextFor(profileId);

    return this.securoApi.request({
      method: 'PATCH',
      path: `/api/goals/${goalId}`,
      ...this.auth(context),
      body: this.compact({
        name: data.name,
        target_amount: this.money(data.targetAmount),
        current_amount: this.money(data.currentAmount),
        target_date: data.targetDate,
        status: data.status,
      }),
    });
  }

  async removeGoal(profileId: string, goalId: string) {
    const context = await this.contextFor(profileId);

    await this.securoApi.request({
      method: 'DELETE',
      path: `/api/goals/${goalId}`,
      ...this.auth(context),
    });

    return { deleted: true, goalId };
  }

  // Recurring transactions (salary and fixed bills)

  async findRecurringTransactions(profileId: string) {
    const context = await this.contextFor(profileId);

    return this.securoApi.request({
      method: 'GET',
      path: '/api/recurring-transactions',
      ...this.auth(context),
    });
  }

  async createRecurringTransaction(
    profileId: string,
    data: CreateRecurringTransactionDto,
  ) {
    const context = await this.contextFor(profileId);

    return this.securoApi.request({
      method: 'POST',
      path: '/api/recurring-transactions',
      ...this.auth(context),
      body: this.compact({
        description: data.description,
        amount: this.money(data.amount),
        type: data.type,
        frequency: data.frequency,
        start_date: data.startDate,
        day_of_month: data.dayOfMonth,
        end_date: data.endDate,
        account_id: data.accountId ?? context.defaultAccountId,
        category_id: data.categoryId,
        currency: data.currency ?? FINANCE_DEFAULT_CURRENCY,
      }),
    });
  }

  async updateRecurringTransaction(
    profileId: string,
    recurringTransactionId: string,
    data: UpdateRecurringTransactionDto,
  ) {
    const context = await this.contextFor(profileId);

    return this.securoApi.request({
      method: 'PATCH',
      path: `/api/recurring-transactions/${recurringTransactionId}`,
      ...this.auth(context),
      body: this.compact({
        description: data.description,
        amount: this.money(data.amount),
        frequency: data.frequency,
        day_of_month: data.dayOfMonth,
        end_date: data.endDate,
        category_id: data.categoryId,
        is_active: data.isActive,
      }),
    });
  }

  async removeRecurringTransaction(
    profileId: string,
    recurringTransactionId: string,
  ) {
    const context = await this.contextFor(profileId);

    await this.securoApi.request({
      method: 'DELETE',
      path: `/api/recurring-transactions/${recurringTransactionId}`,
      ...this.auth(context),
    });

    return { deleted: true, recurringTransactionId };
  }

  // Assets (investments)

  async findAssets(profileId: string) {
    const context = await this.contextFor(profileId);

    return this.securoApi.request({
      method: 'GET',
      path: '/api/assets',
      ...this.auth(context),
    });
  }

  async createAsset(profileId: string, data: CreateAssetDto) {
    const context = await this.contextFor(profileId);

    return this.securoApi.request({
      method: 'POST',
      path: '/api/assets',
      ...this.auth(context),
      body: this.compact({
        name: data.name,
        type: data.type,
        currency: data.currency ?? FINANCE_DEFAULT_CURRENCY,
        current_value: this.money(data.currentValue),
        purchase_date: data.purchaseDate,
        purchase_price: data.purchasePrice,
        ticker: data.ticker,
        units: data.units,
      }),
    });
  }

  async addAssetValue(
    profileId: string,
    assetId: string,
    data: CreateAssetValueDto,
  ) {
    const context = await this.contextFor(profileId);

    return this.securoApi.request({
      method: 'POST',
      path: `/api/assets/${assetId}/values`,
      ...this.auth(context),
      body: {
        amount: this.money(data.amount),
        date: data.date,
      },
    });
  }

  async createAssetTrade(
    profileId: string,
    assetId: string,
    data: CreateAssetTradeDto,
  ) {
    const context = await this.contextFor(profileId);

    return this.securoApi.request({
      method: 'POST',
      path: `/api/assets/${assetId}/transactions`,
      ...this.auth(context),
      body: this.compact({
        kind: data.kind,
        quantity: data.quantity,
        price: data.price,
        date: data.date,
        fee: this.money(data.fee),
        notes: data.notes,
      }),
    });
  }

  async findAssetTrades(profileId: string, assetId: string) {
    const context = await this.contextFor(profileId);

    return this.securoApi.request({
      method: 'GET',
      path: `/api/assets/${assetId}/transactions`,
      ...this.auth(context),
    });
  }

  async removeAsset(profileId: string, assetId: string) {
    const context = await this.contextFor(profileId);

    await this.securoApi.request({
      method: 'DELETE',
      path: `/api/assets/${assetId}`,
      ...this.auth(context),
    });

    return { deleted: true, assetId };
  }

  // Helpers

  private async contextFor(profileId: string): Promise<SecuroContext> {
    const profile = await this.profileService.findOne({ id: profileId });

    if (!profile) {
      throw new NotFoundException(`Profile ${profileId} not found`);
    }

    const securoAccount =
      await this.securoProvisioning.ensureSecuroAccount(profile);

    if (!securoAccount.workspaceId || !securoAccount.defaultAccountId) {
      throw new Error(
        `Securo account for profile ${profileId} is missing workspace data.`,
      );
    }

    const token = await this.securoProvisioning.getUserToken(profile);

    return {
      token,
      workspaceId: securoAccount.workspaceId,
      defaultAccountId: securoAccount.defaultAccountId,
    };
  }

  private auth(context: SecuroContext) {
    return { token: context.token, workspaceId: context.workspaceId };
  }

  // Securo serializes money as Numeric(15,2); sending strings avoids float noise.
  private money(value: number): string;
  private money(value: number | undefined): string | undefined;
  private money(value: number | undefined): string | undefined {
    return value === undefined ? undefined : value.toFixed(2);
  }

  private compact<T extends Record<string, unknown>>(payload: T): T {
    return Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined),
    ) as T;
  }
}
