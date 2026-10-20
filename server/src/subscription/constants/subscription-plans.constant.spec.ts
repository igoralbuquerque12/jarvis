import {
  FREE_TIER_PLAN,
  getPlanFeatures,
  hasPlanAccess,
  PLAN_FEATURE_MIN_PLAN,
} from './subscription-plans.constant';

describe('hasPlanAccess', () => {
  it('grants equal or higher plans and denies lower ones', () => {
    expect(hasPlanAccess(2, 2)).toBe(true);
    expect(hasPlanAccess(3, 2)).toBe(true);
    expect(hasPlanAccess(1, 2)).toBe(false);
  });
});

describe('getPlanFeatures', () => {
  it('derives the flags from the feature minimums', () => {
    expect(getPlanFeatures(FREE_TIER_PLAN)).toEqual({
      messageLimit: FREE_TIER_PLAN < PLAN_FEATURE_MIN_PLAN.unlimitedMessages,
      eventsManagement:
        FREE_TIER_PLAN >= PLAN_FEATURE_MIN_PLAN.eventsManagement,
      fullFinanceManagement:
        FREE_TIER_PLAN >= PLAN_FEATURE_MIN_PLAN.fullFinanceManagement,
    });
  });

  it('lifts the message limit from the unlimited-messages plan on', () => {
    expect(
      getPlanFeatures(PLAN_FEATURE_MIN_PLAN.unlimitedMessages).messageLimit,
    ).toBe(false);
  });
});
