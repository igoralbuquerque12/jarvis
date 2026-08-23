import { IsIn, IsOptional } from 'class-validator';
import { SECURO_GOAL_STATUSES } from '../../core/constants/securo-vocab.constant';

export class FindGoalsDto {
  @IsOptional()
  @IsIn(SECURO_GOAL_STATUSES)
  status?: (typeof SECURO_GOAL_STATUSES)[number];
}
