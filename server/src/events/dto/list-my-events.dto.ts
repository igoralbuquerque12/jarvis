import { EventExecutionStatus, EventSeriesType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  EVENT_LIST_TABS,
  MAX_EVENTS_PAGE_SIZE,
  PAST_EVENT_STATUSES,
} from '../constants/event-execution.constant';
import type { EventListTab } from '../types/event-execution.types';

export class ListMyEventsDto {
  @IsOptional()
  @IsIn(EVENT_LIST_TABS)
  tab?: EventListTab;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsEnum(EventSeriesType)
  type?: EventSeriesType;

  @IsOptional()
  @IsIn(PAST_EVENT_STATUSES)
  status?: EventExecutionStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_EVENTS_PAGE_SIZE)
  limit?: number;
}
