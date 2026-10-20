import type { PlanFeatures } from '../../types/api';

export interface PlanFeatureItem {
  key: keyof PlanFeatures;
  label: string;
  included: boolean;
}

/** Turns the plan's feature flags into display rows, in a fixed order. */
export function describePlanFeatures(
  features: PlanFeatures,
): PlanFeatureItem[] {
  return [
    {
      key: 'messageLimit',
      label: 'Mensagens ilimitadas',
      included: !features.messageLimit,
    },
    {
      key: 'eventsManagement',
      label: 'Gestão de eventos e lembretes',
      included: features.eventsManagement,
    },
    {
      key: 'fullFinanceManagement',
      label: 'Gestão financeira completa',
      included: features.fullFinanceManagement,
    },
  ];
}
