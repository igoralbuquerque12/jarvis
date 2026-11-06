export const EVENTS_SCHEDULE_CACHE_KEY = 'events:schedule:pending-cache';
export const EVENTS_SCHEDULE_CACHE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
export const EVENTS_SCHEDULE_CACHE_TTL_SECONDS =
  EVENTS_SCHEDULE_CACHE_WINDOW_MS / 1000;

export const EVENTS_ASSISTANT_CACHE_KEY_PREFIX = 'events:assistant:cache:';
export const EVENTS_ASSISTANT_CACHE_TTL_SECONDS = 30 * 60; // 30 minutes

export function getEventsAssistantCacheKey(profileId: string): string {
  return `${EVENTS_ASSISTANT_CACHE_KEY_PREFIX}${profileId}`;
}
