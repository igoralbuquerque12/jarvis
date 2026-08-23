import { IsDefined, IsIn } from 'class-validator';
import {
  SECURO_RULE_FIELDS,
  SECURO_RULE_OPS,
} from '../../core/constants/securo-vocab.constant';

export class RuleConditionDto {
  @IsIn(SECURO_RULE_FIELDS)
  field: (typeof SECURO_RULE_FIELDS)[number];

  @IsIn(SECURO_RULE_OPS)
  op: (typeof SECURO_RULE_OPS)[number];

  @IsDefined()
  value: unknown;
}
