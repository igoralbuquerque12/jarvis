/** `RuleRead` as returned by Securo's `/api/rules`. */
export interface SecuroRule {
  id: string;
  name: string;
  conditions_op: string;
  conditions: Record<string, unknown>[];
  actions: Record<string, unknown>[];
  priority: number;
  is_active: boolean;
  applied_count?: number;
}

export interface RuleView {
  id: string;
  name: string;
  conditionsOp: string;
  conditions: Record<string, unknown>[];
  actions: Record<string, unknown>[];
  priority: number;
  isActive: boolean;
  appliedCount?: number;
}

export function toRuleView(rule: SecuroRule): RuleView {
  return {
    id: rule.id,
    name: rule.name,
    conditionsOp: rule.conditions_op,
    conditions: rule.conditions,
    actions: rule.actions,
    priority: rule.priority,
    isActive: rule.is_active,
    appliedCount: rule.applied_count,
  };
}
