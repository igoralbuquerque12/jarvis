import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { SECURO_RULE_CONDITIONS_OPS } from '../../core/constants/securo-vocab.constant';
import { RuleActionDto } from './rule-action.dto';
import { RuleConditionDto } from './rule-condition.dto';

export class UpdateRuleDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RuleConditionDto)
  conditions?: RuleConditionDto[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RuleActionDto)
  actions?: RuleActionDto[];

  @IsOptional()
  @IsIn(SECURO_RULE_CONDITIONS_OPS)
  conditionsOp?: (typeof SECURO_RULE_CONDITIONS_OPS)[number];

  @IsOptional()
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
