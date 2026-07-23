import { EventSeriesType } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID, Matches } from 'class-validator';

export class FindActiveEventsDto {
  @IsUUID()
  profileId: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  scheduledAt?: string;

  @IsOptional()
  @IsEnum(EventSeriesType)
  type?: EventSeriesType;
}
