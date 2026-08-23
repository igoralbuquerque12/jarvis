import { Injectable } from '@nestjs/common';
import { FINANCE_DEFAULT_CURRENCY } from '../../core/constants/finance-defaults.constant';
import { SecuroApiService } from '../../core/services/securo-api.service';
import { SecuroContextService } from '../../core/services/securo-context.service';
import { CreateRecurringTransactionDto } from '../dto/create-recurring-transaction.dto';
import { UpdateRecurringTransactionDto } from '../dto/update-recurring-transaction.dto';

@Injectable()
export class RecurringTransactionsService {
  constructor(
    private readonly securoApi: SecuroApiService,
    private readonly securoContext: SecuroContextService,
  ) {}

  async findRecurringTransactions(profileId: string) {
    const context = await this.securoContext.contextFor(profileId);

    return this.securoApi.request({
      method: 'GET',
      path: '/api/recurring-transactions',
      ...this.securoContext.auth(context),
    });
  }

  async createRecurringTransaction(
    profileId: string,
    data: CreateRecurringTransactionDto,
  ) {
    const context = await this.securoContext.contextFor(profileId);

    return this.securoApi.request({
      method: 'POST',
      path: '/api/recurring-transactions',
      ...this.securoContext.auth(context),
      body: this.securoContext.compact({
        description: data.description,
        amount: this.securoContext.money(data.amount),
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
    const context = await this.securoContext.contextFor(profileId);

    return this.securoApi.request({
      method: 'PATCH',
      path: `/api/recurring-transactions/${recurringTransactionId}`,
      ...this.securoContext.auth(context),
      body: this.securoContext.compact({
        description: data.description,
        amount: this.securoContext.money(data.amount),
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
    const context = await this.securoContext.contextFor(profileId);

    await this.securoApi.request({
      method: 'DELETE',
      path: `/api/recurring-transactions/${recurringTransactionId}`,
      ...this.securoContext.auth(context),
    });

    return { deleted: true, recurringTransactionId };
  }
}
