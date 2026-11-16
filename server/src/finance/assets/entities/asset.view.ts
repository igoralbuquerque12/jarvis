import {
  optional,
  SecuroNumeric,
  toNumber,
  toOptionalNumber,
} from '../../core/utils/securo-value.util';

/** `AssetRead` as returned by Securo's `/api/assets`. */
export interface SecuroAsset {
  id: string;
  name: string;
  type: string;
  currency: string;
  units?: SecuroNumeric | null;
  purchase_date?: string | null;
  purchase_price?: SecuroNumeric | null;
  current_value?: SecuroNumeric | null;
  ticker?: string | null;
  average_price?: SecuroNumeric | null;
  total_invested?: SecuroNumeric | null;
  realized_gain?: SecuroNumeric | null;
}

/** `AssetTransactionRead` as returned by `/api/assets/:id/transactions`. */
export interface SecuroAssetTrade {
  id: string;
  asset_id: string;
  kind: string;
  quantity: SecuroNumeric;
  price: SecuroNumeric;
  fee?: SecuroNumeric | null;
  date: string;
  notes?: string | null;
}

/** `AssetValueRead` as returned by `/api/assets/:id/values`. */
export interface SecuroAssetValue {
  id: string;
  asset_id: string;
  amount: SecuroNumeric;
  date: string;
}

export interface AssetView {
  id: string;
  name: string;
  type: string;
  currency: string;
  units?: number;
  purchaseDate?: string;
  purchasePrice?: number;
  currentValue?: number;
  ticker?: string;
  averagePrice?: number;
  totalCost?: number;
  realizedGain?: number;
}

export interface AssetTradeView {
  id: string;
  assetId: string;
  kind: string;
  quantity: number;
  price: number;
  fee: number;
  date: string;
  notes?: string;
}

export interface AssetValueView {
  id: string;
  assetId: string;
  amount: number;
  date: string;
}

export function toAssetView(asset: SecuroAsset): AssetView {
  return {
    id: asset.id,
    name: asset.name,
    type: asset.type,
    currency: asset.currency,
    units: toOptionalNumber(asset.units),
    purchaseDate: optional(asset.purchase_date),
    purchasePrice: toOptionalNumber(asset.purchase_price),
    currentValue: toOptionalNumber(asset.current_value),
    ticker: optional(asset.ticker),
    averagePrice: toOptionalNumber(asset.average_price),
    totalCost: toOptionalNumber(asset.total_invested),
    realizedGain: toOptionalNumber(asset.realized_gain),
  };
}

export function toAssetTradeView(trade: SecuroAssetTrade): AssetTradeView {
  return {
    id: trade.id,
    assetId: trade.asset_id,
    kind: trade.kind,
    quantity: toNumber(trade.quantity),
    price: toNumber(trade.price),
    fee: toNumber(trade.fee),
    date: trade.date,
    notes: optional(trade.notes),
  };
}

export function toAssetValueView(value: SecuroAssetValue): AssetValueView {
  return {
    id: value.id,
    assetId: value.asset_id,
    amount: toNumber(value.amount),
    date: value.date,
  };
}
