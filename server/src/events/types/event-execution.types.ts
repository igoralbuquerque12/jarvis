import type { EventExecutionStatus, EventSeriesType } from '@prisma/client';
import type { EVENT_LIST_TABS } from '../constants/event-execution.constant';

export type EventListTab = (typeof EVENT_LIST_TABS)[number];

export type ActiveExecutionFilters = {
  profileId: string;
  type?: EventSeriesType;
  scheduledAtStart?: Date;
  scheduledAtEnd?: Date;
};

export type EventPageFilters = {
  profileId: string;
  tab: EventListTab;
  q?: string;
  type?: EventSeriesType;
  /** Narrows the "past" tab to a single terminal status. */
  status?: EventExecutionStatus;
  page: number;
  limit: number;
};

/** The slice of `Profile` the web-facing event operations need. */
export type EventOwnerProfile = { id: string; timezone: string };
