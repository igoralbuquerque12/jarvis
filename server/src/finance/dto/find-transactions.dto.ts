import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';
import {
  ISO_DATE_PATTERN,
  SECURO_TRANSACTION_TYPES,
} from '../constants/securo-vocab.constant';

export class FindTransactionsDto {
  @IsOptional()
  @Matches(ISO_DATE_PATTERN)
  from?: string;

  @IsOptional()
  @Matches(ISO_DATE_PATTERN)
  to?: string;

  @IsOptional()
  @IsIn(SECURO_TRANSACTION_TYPES)
  type?: (typeof SECURO_TRANSACTION_TYPES)[number];

  @IsOptional()
  @IsUUID()
  accountId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}
