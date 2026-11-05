import { apiFetch } from '../lib/api';
import type {
  CreateEventPayload,
  EventListTab,
  EventPage,
  EventSeriesType,
  UpcomingEvent,
  UpdateEventPayload,
} from '../types/api';

export function getMyUpcomingEvents(): Promise<UpcomingEvent[]> {
  return apiFetch<UpcomingEvent[]>('/events/me');
}

export interface FindEventsParams {
  tab?: EventListTab;
  q?: string;
  type?: EventSeriesType;
  status?: 'COMPLETED' | 'FAILED' | 'CANCELLED';
  page?: number;
  limit?: number;
}

export function getMyEventPage(params: FindEventsParams = {}): Promise<EventPage> {
  const qs = new URLSearchParams();
  if (params.tab) qs.set('tab', params.tab);
  if (params.q) qs.set('q', params.q);
  if (params.type) qs.set('type', params.type);
  if (params.status) qs.set('status', params.status);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));

  const query = qs.toString();
  return apiFetch<EventPage>(`/events/me/list${query ? `?${query}` : ''}`);
}

export function createMyEvent(payload: CreateEventPayload): Promise<UpcomingEvent> {
  return apiFetch<UpcomingEvent>('/events/me', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateMyEvent(
  id: string,
  payload: UpdateEventPayload,
): Promise<UpcomingEvent> {
  return apiFetch<UpcomingEvent>(`/events/me/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function cancelMyEventSeries(
  seriesId: string,
): Promise<{ cancelledExecutions: number }> {
  return apiFetch<{ cancelledExecutions: number }>(
    `/events/me/series/${seriesId}`,
    { method: 'DELETE' },
  );
}
