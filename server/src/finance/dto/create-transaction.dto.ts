import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  ISO_DATE_PATTERN,
  SECURO_TRANSACTION_TYPES,
} from '../constants/securo-vocab.constant';

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @IsIn(SECURO_TRANSACTION_TYPES)
  type: (typeof SECURO_TRANSACTION_TYPES)[number];

  @Matches(ISO_DATE_PATTERN)
  date: string;

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

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
}
