export const EVENTS_SCHEDULE_CACHE_KEY = 'events:schedule:pending-cache';
export const EVENTS_SCHEDULE_CACHE_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours
export const EVENTS_SCHEDULE_CACHE_TTL_SECONDS =
  EVENTS_SCHEDULE_CACHE_WINDOW_MS / 1000;
