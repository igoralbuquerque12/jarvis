import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { SECURO_ACCOUNT_TYPES } from '../../core/constants/securo-vocab.constant';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsIn(SECURO_ACCOUNT_TYPES)
  type: (typeof SECURO_ACCOUNT_TYPES)[number];

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  balance?: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
}
