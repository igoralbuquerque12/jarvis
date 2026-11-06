import { EventSeriesType } from '@prisma/client';
import { IsEnum, IsIn, IsOptional, IsUUID, Matches } from 'class-validator';
import {
  ACTIVE_EVENT_FILTERS,
  type ActiveEventFilter,
} from '../constants/event-execution.constant';

export class FindActiveEventsDto {
  @IsUUID()
  profileId: string;

  @IsOptional()
  @IsIn(ACTIVE_EVENT_FILTERS)
  filter?: ActiveEventFilter;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  scheduledAt?: string;

  @IsOptional()
  @IsEnum(EventSeriesType)
  type?: EventSeriesType;
}
