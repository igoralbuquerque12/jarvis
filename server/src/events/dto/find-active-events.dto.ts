import { EventSeriesType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';

export class FindActiveEventsDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsEnum(EventSeriesType)
  type?: EventSeriesType;
}
