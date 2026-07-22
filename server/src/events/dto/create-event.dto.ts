import { EventSeriesType, RecurrenceMode } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateEventDto {
  @IsUUID()
  profileId: string;

  @IsEnum(EventSeriesType)
  type: EventSeriesType;

  @IsDateString()
  startAt: string;

  @IsString()
  @IsNotEmpty()
  timezone: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @ValidateIf((dto: CreateEventDto) => dto.type === EventSeriesType.RECURRENCE)
  @IsInt()
  @Min(1)
  recurrenceInterval?: number;

  @ValidateIf((dto: CreateEventDto) => dto.type === EventSeriesType.RECURRENCE)
  @IsEnum(RecurrenceMode)
  recurrenceMode?: RecurrenceMode;
}
