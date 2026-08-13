export interface ProfileSubscription {
  id: string;
  name: string;
  price: number;
  limit: number;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  limit: number;
}

export interface ProfileMe {
  name: string;
  about: string;
  timezone: string;
  token: string;
  whatsappLinked: boolean;
  whatsappNumber: string | null;
  subscription: ProfileSubscription;
  createdAt: string;
}

export type EventSeriesType = 'UNIQUE' | 'RECURRENCE';

export type RecurrenceMode = 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';

export type EventExecutionStatus = 'PENDING' | 'PROCESSING';

export interface UpcomingEvent {
  id: string;
  content: string;
  scheduledAt: string;
  status: EventExecutionStatus;
  series: {
    id: string;
    type: EventSeriesType;
    recurrenceInterval: number | null;
    recurrenceMode: RecurrenceMode | null;
  };
}
