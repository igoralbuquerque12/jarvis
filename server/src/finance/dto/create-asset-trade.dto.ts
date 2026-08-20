import {
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import {
  ISO_DATE_PATTERN,
  SECURO_ASSET_TRADE_KINDS,
} from '../constants/securo-vocab.constant';

export class CreateAssetTradeDto {
  @IsIn(SECURO_ASSET_TRADE_KINDS)
  kind: (typeof SECURO_ASSET_TRADE_KINDS)[number];

  @IsNumber({ maxDecimalPlaces: 6 })
  @IsPositive()
  quantity: number;

  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  price: number;

  @Matches(ISO_DATE_PATTERN)
  date: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  fee?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
