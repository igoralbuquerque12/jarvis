import { EventSeriesType, RecurrenceMode } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

/**
 * Web variant of `CreateEventDto`: the owner comes from the session, so there
 * is no `profileId`. `startAt` may omit the offset; it is read in the profile
 * timezone.
 */
export class CreateMyEventDto {
  @IsEnum(EventSeriesType)
  type: EventSeriesType;

  @IsDateString()
  startAt: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;

  @ValidateIf(
    (dto: CreateMyEventDto) => dto.type === EventSeriesType.RECURRENCE,
  )
  @IsInt()
  @Min(1)
  recurrenceInterval?: number;

  @ValidateIf(
    (dto: CreateMyEventDto) => dto.type === EventSeriesType.RECURRENCE,
  )
  @IsEnum(RecurrenceMode)
  recurrenceMode?: RecurrenceMode;
}
