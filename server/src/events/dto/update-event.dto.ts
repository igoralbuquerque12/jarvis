import { EventSeriesType, RecurrenceMode } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateEventDto {
  @IsUUID()
  profileId: string;

  @IsUUID()
  eventSeriesId: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content?: string;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsEnum(EventSeriesType)
  type?: EventSeriesType;

  @IsOptional()
  @IsInt()
  @Min(1)
  recurrenceInterval?: number;

  @IsOptional()
  @IsEnum(RecurrenceMode)
  recurrenceMode?: RecurrenceMode;
}

