export const EVENTS_SCHEDULE_CACHE_KEY = 'events:schedule:pending-cache';
export const EVENTS_SCHEDULE_CACHE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
export const EVENTS_SCHEDULE_CACHE_TTL_SECONDS =
  EVENTS_SCHEDULE_CACHE_WINDOW_MS / 1000;
