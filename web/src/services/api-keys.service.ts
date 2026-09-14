import { apiFetch } from '../lib/api';
import type { ApiKey, CreatedApiKey } from '../types/api';

export interface UpdateApiKeyPayload {
  name?: string;
  active?: boolean;
}

export function getMyApiKeys(): Promise<ApiKey[]> {
  return apiFetch<ApiKey[]>('/api-keys/me');
}

export function createMyApiKey(name: string): Promise<CreatedApiKey> {
  return apiFetch<CreatedApiKey>('/api-keys/me', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function updateMyApiKey(
  id: string,
  payload: UpdateApiKeyPayload,
): Promise<ApiKey> {
  return apiFetch<ApiKey>(`/api-keys/me/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteMyApiKey(id: string): Promise<null> {
  return apiFetch<null>(`/api-keys/me/${id}`, { method: 'DELETE' });
}
