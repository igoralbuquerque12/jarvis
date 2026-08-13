import { apiFetch } from '../lib/api';
import type { Plan } from '../types/api';

export function getPlans(): Promise<Plan[]> {
  return apiFetch<Plan[]>('/subscriptions');
}
