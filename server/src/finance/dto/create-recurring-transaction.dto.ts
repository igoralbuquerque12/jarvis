import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import {
  ISO_DATE_PATTERN,
  SECURO_RECURRENCE_FREQUENCIES,
  SECURO_TRANSACTION_TYPES,
} from '../constants/securo-vocab.constant';

export class CreateRecurringTransactionDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @IsIn(SECURO_TRANSACTION_TYPES)
  type: (typeof SECURO_TRANSACTION_TYPES)[number];

  @IsIn(SECURO_RECURRENCE_FREQUENCIES)
  frequency: (typeof SECURO_RECURRENCE_FREQUENCIES)[number];

  @Matches(ISO_DATE_PATTERN)
  startDate: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;

  @IsOptional()
  @Matches(ISO_DATE_PATTERN)
  endDate?: string;

  @IsOptional()
  @IsUUID()
  accountId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
}
