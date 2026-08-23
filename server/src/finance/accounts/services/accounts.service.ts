import { Injectable } from '@nestjs/common';
import { FINANCE_DEFAULT_CURRENCY } from '../../core/constants/finance-defaults.constant';
import { SecuroApiService } from '../../core/services/securo-api.service';
import { SecuroContextService } from '../../core/services/securo-context.service';
import { CreateAccountDto } from '../dto/create-account.dto';

@Injectable()
export class AccountsService {
  constructor(
    private readonly securoApi: SecuroApiService,
    private readonly securoContext: SecuroContextService,
  ) {}

  async findAccounts(profileId: string) {
    const context = await this.securoContext.contextFor(profileId);

    return this.securoApi.request({
      method: 'GET',
      path: '/api/accounts',
      ...this.securoContext.auth(context),
    });
  }

  async createAccount(profileId: string, data: CreateAccountDto) {
    const context = await this.securoContext.contextFor(profileId);

    return this.securoApi.request({
      method: 'POST',
      path: '/api/accounts',
      ...this.securoContext.auth(context),
      body: this.securoContext.compact({
        name: data.name,
        type: data.type,
        balance: this.securoContext.money(data.balance),
        currency: data.currency ?? FINANCE_DEFAULT_CURRENCY,
      }),
    });
  }
}
