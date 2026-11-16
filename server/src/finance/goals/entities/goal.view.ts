import {
  optional,
  SecuroNumeric,
  toNumber,
} from '../../core/utils/securo-value.util';

/** `GoalRead` as returned by Securo's `/api/goals`. */
export interface SecuroGoal {
  id: string;
  name: string;
  target_amount: SecuroNumeric;
  current_amount: SecuroNumeric;
  currency: string;
  target_date?: string | null;
  status: string;
  icon?: string | null;
  color?: string | null;
  percentage?: number | null;
  created_at: string;
}

export interface GoalView {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  targetDate?: string;
  status: string;
  icon?: string;
  color?: string;
  percentage: number;
  createdAt: string;
}

export function toGoalView(goal: SecuroGoal): GoalView {
  return {
    id: goal.id,
    name: goal.name,
    targetAmount: toNumber(goal.target_amount),
    currentAmount: toNumber(goal.current_amount),
    currency: goal.currency,
    targetDate: optional(goal.target_date),
    status: goal.status,
    icon: optional(goal.icon),
    color: optional(goal.color),
    percentage: toNumber(goal.percentage),
    createdAt: goal.created_at,
  };
}
