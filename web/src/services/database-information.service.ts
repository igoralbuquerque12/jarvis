import { apiFetch } from '../lib/api';
import type {
  DatabaseInformation,
  DatabaseInformationPayload,
} from '../types/api';

export function getMyDatabaseInformation(): Promise<DatabaseInformation[]> {
  return apiFetch<DatabaseInformation[]>('/database-information/me');
}

export function createMyDatabaseInformation(
  payload: DatabaseInformationPayload,
): Promise<DatabaseInformation> {
  return apiFetch<DatabaseInformation>('/database-information/me', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateMyDatabaseInformation(
  id: string,
  payload: DatabaseInformationPayload,
): Promise<DatabaseInformation> {
  return apiFetch<DatabaseInformation>(`/database-information/me/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteMyDatabaseInformation(id: string): Promise<null> {
  return apiFetch<null>(`/database-information/me/${id}`, {
    method: 'DELETE',
  });
}
