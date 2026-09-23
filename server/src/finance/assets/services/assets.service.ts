import { Injectable } from '@nestjs/common';
import { FINANCE_DEFAULT_CURRENCY } from '../../core/constants/finance-defaults.constant';
import { SecuroApiService } from '../../core/services/securo-api.service';
import { SecuroContextService } from '../../core/services/securo-context.service';
import { CreateAssetDto } from '../dto/create-asset.dto';
import { CreateAssetTradeDto } from '../dto/create-asset-trade.dto';
import { CreateAssetValueDto } from '../dto/create-asset-value.dto';

@Injectable()
export class AssetsService {
  constructor(
    private readonly securoApi: SecuroApiService,
    private readonly securoContext: SecuroContextService,
  ) { }

  async findAssets(profileId: string) {
    const context = await this.securoContext.contextFor(profileId);

    return this.securoApi.request({
      method: 'GET',
      path: '/api/assets',
      ...this.securoContext.auth(context),
    });
  }

  async createAsset(profileId: string, data: CreateAssetDto) {
    const context = await this.securoContext.contextFor(profileId);

    return this.securoApi.request({
      method: 'POST',
      path: '/api/assets',
      ...this.securoContext.auth(context),
      body: this.securoContext.compact({
        name: data.name,
        type: data.type,
        currency: data.currency ?? FINANCE_DEFAULT_CURRENCY,
        current_value: this.securoContext.money(data.currentValue),
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
    const context = await this.securoContext.contextFor(profileId);

    return this.securoApi.request({
      method: 'POST',
      path: `/api/assets/${assetId}/values`,
      ...this.securoContext.auth(context),
      body: {
        amount: this.securoContext.money(data.amount),
        date: data.date,
      },
    });
  }

  async createAssetTrade(
    profileId: string,
    assetId: string,
    data: CreateAssetTradeDto,
  ) {
    const context = await this.securoContext.contextFor(profileId);

    return this.securoApi.request({
      method: 'POST',
      path: `/api/assets/${assetId}/transactions`,
      ...this.securoContext.auth(context),
      body: this.securoContext.compact({
        kind: data.kind,
        quantity: data.quantity,
        price: data.price,
        date: data.date,
        fee: this.securoContext.money(data.fee),
        notes: data.notes,
      }),
    });
  }

  async findAssetTrades(profileId: string, assetId: string) {
    const context = await this.securoContext.contextFor(profileId);

    return this.securoApi.request({
      method: 'GET',
      path: `/api/assets/${assetId}/transactions`,
      ...this.securoContext.auth(context),
    });
  }

  async removeAsset(profileId: string, assetId: string) {
    const context = await this.securoContext.contextFor(profileId);

    await this.securoApi.request({
      method: 'DELETE',
      path: `/api/assets/${assetId}`,
      ...this.securoContext.auth(context),
    });

    return { deleted: true, assetId };
  }
}
