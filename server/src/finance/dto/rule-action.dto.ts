import { Allow, IsIn } from 'class-validator';
import { SECURO_RULE_ACTION_OPS } from '../constants/securo-vocab.constant';

export class RuleActionDto {
  @IsIn(SECURO_RULE_ACTION_OPS)
  op: (typeof SECURO_RULE_ACTION_OPS)[number];

  // Free-form on purpose: set_category/set_payee take a UUID, append_notes a
  // string, and ignore takes no value at all. Securo validates the UUIDs.
  @Allow()
  value?: unknown;
}
