import { apiFetch } from '../lib/api';
import type { ProfileMe } from '../types/api';

export interface UpdateProfilePayload {
  name?: string;
  about?: string;
  timezone?: string;
}

export function getMyProfile(): Promise<ProfileMe> {
  return apiFetch<ProfileMe>('/profile/me');
}

export function updateMyProfile(
  payload: UpdateProfilePayload,
): Promise<ProfileMe> {
  return apiFetch<ProfileMe>('/profile/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
