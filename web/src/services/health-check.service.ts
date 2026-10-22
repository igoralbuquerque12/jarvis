import { apiFetch } from '../lib/api';
import type {
  CreateHealthCheckConfigPayload,
  HealthCheckConfig,
  UpdateHealthCheckConfigPayload,
} from '../types/api';

export function getMyHealthCheckConfigs(): Promise<HealthCheckConfig[]> {
  return apiFetch<HealthCheckConfig[]>('/health-check/me');
}

export function createMyHealthCheckConfig(
  payload: CreateHealthCheckConfigPayload,
): Promise<HealthCheckConfig> {
  return apiFetch<HealthCheckConfig>('/health-check/me', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateMyHealthCheckConfig(
  id: string,
  payload: UpdateHealthCheckConfigPayload,
): Promise<HealthCheckConfig> {
  return apiFetch<HealthCheckConfig>(`/health-check/me/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteMyHealthCheckConfig(id: string): Promise<null> {
  return apiFetch<null>(`/health-check/me/${id}`, {
    method: 'DELETE',
  });
}

