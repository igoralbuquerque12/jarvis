import { EventExecutionStatus } from '@prisma/client';

export const EVENT_LIST_TABS = ['upcoming', 'past'] as const;

/** Executions still waiting to fire (or firing right now). */
export const UPCOMING_EVENT_STATUSES: EventExecutionStatus[] = [
  EventExecutionStatus.PENDING,
  EventExecutionStatus.PROCESSING,
];

/** Terminal executions; the "past" tab can filter by any of them. */
export const PAST_EVENT_STATUSES: EventExecutionStatus[] = [
  EventExecutionStatus.COMPLETED,
  EventExecutionStatus.FAILED,
  EventExecutionStatus.CANCELLED,
];

/** Series fields exposed next to an execution in list responses. */
export const EVENT_SERIES_SUMMARY_SELECT = {
  id: true,
  type: true,
  active: true,
  recurrenceInterval: true,
  recurrenceMode: true,
} as const;

export const DEFAULT_EVENTS_PAGE_SIZE = 25;
export const MAX_EVENTS_PAGE_SIZE = 100;
