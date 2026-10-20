/**
 * Plans are identified by `subscriptions.plan` and ranked by it: a higher
 * number is a higher tier, so access checks are `plan >= minimum`. Plans are
 * never deleted (only deactivated) so a number is never reused out of order.
 */
export const FREE_TIER_PLAN = 1;

/** Name/price used when the default plan row has to be created (signup, seed). */
export const FREE_TIER_DEFAULTS = { name: 'Free Tier', price: 0 } as const;

/**
 * Minimum plan of the core features. Kept here because the web shows them
 * and the main modules guard with them; any other module declares its own
 * minimum locally (`@RequiresPlan(n)`, `minPlan` on an assistant tool).
 */
export const PLAN_FEATURE_MIN_PLAN = {
  unlimitedMessages: 2,
  eventsManagement: FREE_TIER_PLAN,
  fullFinanceManagement: FREE_TIER_PLAN,
} as const;

/** Feature flags exposed to the web, derived from the minimums above. */
export interface SubscriptionPlanFeatures {
  /** The plan caps how many messages the profile can send. */
  messageLimit: boolean;
  /** Access to reminders / event scheduling. */
  eventsManagement: boolean;
  /** Access to the full finance module (Securo). */
  fullFinanceManagement: boolean;
}

export function hasPlanAccess(plan: number, minimumPlan: number): boolean {
  return plan >= minimumPlan;
}

export function getPlanFeatures(plan: number): SubscriptionPlanFeatures {
  return {
    messageLimit: !hasPlanAccess(plan, PLAN_FEATURE_MIN_PLAN.unlimitedMessages),
    eventsManagement: hasPlanAccess(
      plan,
      PLAN_FEATURE_MIN_PLAN.eventsManagement,
    ),
    fullFinanceManagement: hasPlanAccess(
      plan,
      PLAN_FEATURE_MIN_PLAN.fullFinanceManagement,
    ),
  };
}
