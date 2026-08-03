import { RecurrenceMode } from '@prisma/client';
import {
  getNextScheduledAt,
  normalizeScheduledAt,
} from './get-next-scheduled-at';
import { DateTime } from 'luxon';

describe('event schedule date utilities', () => {
  it('rounds to the nearest ten minutes and rounds a tie forward', () => {
    expect(
      normalizeScheduledAt(
        DateTime.fromISO('2026-07-25T09:04:59Z', { setZone: true }),
      ).toISO(),
    ).toBe('2026-07-25T09:00:00.000Z');
    expect(
      normalizeScheduledAt(
        DateTime.fromISO('2026-07-25T09:05:00Z', { setZone: true }),
      ).toISO(),
    ).toBe('2026-07-25T09:10:00.000Z');
  });

  it.each([
    [RecurrenceMode.HOUR, 2, '2026-07-25T11:00:00.000Z'],
    [RecurrenceMode.DAY, 2, '2026-07-27T09:00:00.000Z'],
    [RecurrenceMode.WEEK, 1, '2026-08-01T09:00:00.000Z'],
    [RecurrenceMode.MONTH, 1, '2026-08-25T09:00:00.000Z'],
  ])('calculates the next %s recurrence', (mode, interval, expected) => {
    expect(
      getNextScheduledAt(
        new Date('2026-07-25T09:00:00Z'),
        mode,
        interval,
        'UTC',
        new Date('2026-07-25T09:01:00Z'),
      ).toISOString(),
    ).toBe(expected);
  });

  it('skips missed occurrences until the next future local time', () => {
    expect(
      getNextScheduledAt(
        new Date('2026-07-25T09:00:00Z'),
        RecurrenceMode.HOUR,
        1,
        'America/Sao_Paulo',
        new Date('2026-07-25T12:01:00Z'),
      ).toISOString(),
    ).toBe('2026-07-25T13:00:00.000Z');
  });
});
