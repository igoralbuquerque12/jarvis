import { RecurrenceMode } from '@prisma/client';
import { DateTime } from 'luxon';

const TEN_MINUTES_IN_MS = 10 * 60 * 1000;

export function normalizeScheduledAt(date: DateTime): DateTime {
  const hourStart = date.startOf('hour');
  const elapsed = date.toMillis() - hourStart.toMillis();
  const roundedElapsed =
    Math.floor((elapsed + TEN_MINUTES_IN_MS / 2) / TEN_MINUTES_IN_MS) *
    TEN_MINUTES_IN_MS;

  return hourStart.plus({ milliseconds: roundedElapsed });
}

export function getNextScheduledAt(
  scheduledAt: Date,
  recurrenceMode: RecurrenceMode,
  recurrenceInterval: number,
  timezone: string,
  now = new Date(),
): Date {
  if (!Number.isInteger(recurrenceInterval) || recurrenceInterval < 1) {
    throw new Error('recurrenceInterval must be a positive integer.');
  }

  let next = normalizeScheduledAt(
    DateTime.fromJSDate(scheduledAt, { zone: timezone }),
  );
  const current = DateTime.fromJSDate(now, { zone: timezone });

  do {
    next = normalizeScheduledAt(
      next.plus(
        recurrenceMode === RecurrenceMode.HOUR
          ? { hours: recurrenceInterval }
          : recurrenceMode === RecurrenceMode.DAY
            ? { days: recurrenceInterval }
            : recurrenceMode === RecurrenceMode.WEEK
              ? { weeks: recurrenceInterval }
              : { months: recurrenceInterval },
      ),
    );
  } while (next <= current);

  return next.toUTC().toJSDate();
}

export function parseAndNormalizeStartAt(
  startAt: string,
  timezone: string,
): Date {
  const parsed = DateTime.fromISO(startAt, { zone: timezone });

  if (!parsed.isValid || !DateTime.now().setZone(timezone).isValid) {
    throw new Error('Invalid startAt or timezone.');
  }

  return normalizeScheduledAt(parsed).toUTC().toJSDate();
}
