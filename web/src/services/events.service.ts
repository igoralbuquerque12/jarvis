import { apiFetch } from '../lib/api';
import type { UpcomingEvent } from '../types/api';

export function getMyUpcomingEvents(): Promise<UpcomingEvent[]> {
  return apiFetch<UpcomingEvent[]>('/events/me');
}

export function cancelMyEventSeries(
  seriesId: string,
): Promise<{ cancelledExecutions: number }> {
  return apiFetch<{ cancelledExecutions: number }>(
    `/events/me/series/${seriesId}`,
    { method: 'DELETE' },
  );
}
