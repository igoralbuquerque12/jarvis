import { HealthCheckHttpMethod } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateHealthCheckConfigDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_tld: false, protocols: ['http', 'https'] })
  @MaxLength(500)
  url: string;

  @IsEnum(HealthCheckHttpMethod)
  httpMethod: HealthCheckHttpMethod;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  endpoint?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  authKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  authValue?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1500)
  alertMessage: string;
}

