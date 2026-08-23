import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import {
  ISO_DATE_PATTERN,
  SECURO_GOAL_STATUSES,
} from '../../core/constants/securo-vocab.constant';

export class UpdateGoalDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  targetAmount?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  currentAmount?: number;

  @IsOptional()
  @Matches(ISO_DATE_PATTERN)
  targetDate?: string;

  @IsOptional()
  @IsIn(SECURO_GOAL_STATUSES)
  status?: (typeof SECURO_GOAL_STATUSES)[number];
}
