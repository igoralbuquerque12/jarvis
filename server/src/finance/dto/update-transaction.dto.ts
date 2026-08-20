import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  ISO_DATE_PATTERN,
  SECURO_TRANSACTION_TYPES,
} from '../constants/securo-vocab.constant';

export class UpdateTransactionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsIn(SECURO_TRANSACTION_TYPES)
  type?: (typeof SECURO_TRANSACTION_TYPES)[number];

  @IsOptional()
  @Matches(ISO_DATE_PATTERN)
  date?: string;

  @IsOptional()
  @IsUUID()
  accountId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
