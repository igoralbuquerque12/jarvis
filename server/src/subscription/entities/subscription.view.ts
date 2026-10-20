import type { Subscription } from '@prisma/client';
import {
  getPlanFeatures,
  SubscriptionPlanFeatures,
} from '../constants/subscription-plans.constant';

export interface SubscriptionView {
  id: string;
  name: string;
  price: number;
  plan: number;
  features: SubscriptionPlanFeatures;
}

/** Merges the DB row with its code-managed plan config. */
export function toSubscriptionView(
  subscription: Pick<Subscription, 'id' | 'name' | 'price' | 'plan'>,
): SubscriptionView {
  return {
    id: subscription.id,
    name: subscription.name,
    price: Number(subscription.price),
    plan: subscription.plan,
    features: getPlanFeatures(subscription.plan),
  };
}
