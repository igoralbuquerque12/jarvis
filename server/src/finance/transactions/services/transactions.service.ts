import { Injectable } from '@nestjs/common';
import { SecuroApiService } from '../../core/services/securo-api.service';
import { SecuroContextService } from '../../core/services/securo-context.service';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { FindTransactionsDto } from '../dto/find-transactions.dto';
import { UpdateTransactionDto } from '../dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly securoApi: SecuroApiService,
    private readonly securoContext: SecuroContextService,
  ) {}

  async createTransaction(profileId: string, data: CreateTransactionDto) {
    const context = await this.securoContext.contextFor(profileId);

    return this.securoApi.request({
      method: 'POST',
      path: '/api/transactions',
      ...this.securoContext.auth(context),
      body: this.securoContext.compact({
        description: data.description,
        amount: this.securoContext.money(data.amount),
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
    const context = await this.securoContext.contextFor(profileId);

    return this.securoApi.request({
      method: 'GET',
      path: '/api/transactions',
      ...this.securoContext.auth(context),
      query: this.securoContext.compact({
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
    const context = await this.securoContext.contextFor(profileId);

    return this.securoApi.request({
      method: 'PATCH',
      path: `/api/transactions/${transactionId}`,
      ...this.securoContext.auth(context),
      body: this.securoContext.compact({
        description: data.description,
        amount: this.securoContext.money(data.amount),
        date: data.date,
        type: data.type,
        account_id: data.accountId,
        category_id: data.categoryId,
        notes: data.notes,
      }),
    });
  }

  async removeTransaction(profileId: string, transactionId: string) {
    const context = await this.securoContext.contextFor(profileId);

    await this.securoApi.request({
      method: 'DELETE',
      path: `/api/transactions/${transactionId}`,
      ...this.securoContext.auth(context),
    });

    return { deleted: true, transactionId };
  }
}
