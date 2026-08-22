import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import {
  ISO_DATE_PATTERN,
  SECURO_ASSET_TYPES,
} from '../constants/securo-vocab.constant';

export class CreateAssetDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsIn(SECURO_ASSET_TYPES)
  type: (typeof SECURO_ASSET_TYPES)[number];

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  currentValue?: number;

  @IsOptional()
  @Matches(ISO_DATE_PATTERN)
  purchaseDate?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsPositive()
  purchasePrice?: number;

  @IsOptional()
  @IsString()
  ticker?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsPositive()
  units?: number;
}
