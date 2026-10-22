import { HealthCheckHttpMethod } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class UpdateHealthCheckConfigDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_tld: false, protocols: ['http', 'https'] })
  @MaxLength(500)
  url?: string;

  @IsOptional()
  @IsEnum(HealthCheckHttpMethod)
  httpMethod?: HealthCheckHttpMethod;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  endpoint?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  authKey?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  authValue?: string | null;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1500)
  alertMessage?: string;
}

