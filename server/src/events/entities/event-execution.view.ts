import type {
  EventExecutionStatus,
  EventSeriesType,
  RecurrenceMode,
} from '@prisma/client';

interface ExecutionWithSeries {
  id: string;
  content: string;
  scheduledAt: Date;
  status: EventExecutionStatus;
  observabilitys: string | null;
  eventSeries: {
    id: string;
    type: EventSeriesType;
    recurrenceInterval: number | null;
    recurrenceMode: RecurrenceMode | null;
  };
}

/** Representation of an execution returned to the authenticated web panel. */
export interface EventExecutionView {
  id: string;
  content: string;
  scheduledAt: Date;
  status: EventExecutionStatus;
  /** Failure reason; only set when the execution failed. */
  observabilitys: string | null;
  series: {
    id: string;
    type: EventSeriesType;
    recurrenceInterval: number | null;
    recurrenceMode: RecurrenceMode | null;
  };
}

export interface EventPageView {
  items: EventExecutionView[];
  total: number;
  page: number;
  limit: number;
  counts: { upcoming: number; past: number };
}

export function toEventExecutionView(
  execution: ExecutionWithSeries,
): EventExecutionView {
  return {
    id: execution.id,
    content: execution.content,
    scheduledAt: execution.scheduledAt,
    status: execution.status,
    observabilitys: execution.observabilitys,
    series: {
      id: execution.eventSeries.id,
      type: execution.eventSeries.type,
      recurrenceInterval: execution.eventSeries.recurrenceInterval,
      recurrenceMode: execution.eventSeries.recurrenceMode,
    },
  };
}
