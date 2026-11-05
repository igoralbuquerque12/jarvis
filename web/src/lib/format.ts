import type { RecurrenceMode, UpcomingEvent } from '../types/api';

export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatEventInstant(iso: string, timezone: string) {
  const date = new Date(iso);
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('pt-BR', { ...options, timeZone: timezone }).format(
      date,
    );

  return {
    day: part({ day: '2-digit' }),
    month: part({ month: 'short' }).replace('.', ''),
    weekday: part({ weekday: 'long' }),
    time: part({ hour: '2-digit', minute: '2-digit' }),
    full: part({ dateStyle: 'full', timeStyle: 'short' }),
  };
}

const RECURRENCE_UNITS: Record<RecurrenceMode, [string, string]> = {
  HOUR: ['hora', 'horas'],
  DAY: ['dia', 'dias'],
  WEEK: ['semana', 'semanas'],
  MONTH: ['mês', 'meses'],
};

export function describeRecurrence(series: UpcomingEvent['series']): string {
  if (series.type === 'UNIQUE') {
    return 'Único';
  }

  const interval = series.recurrenceInterval ?? 1;
  const mode = series.recurrenceMode ?? 'DAY';
  const [singular, plural] = RECURRENCE_UNITS[mode];

  if (interval === 1) {
    return `A cada ${singular}`;
  }

  return `A cada ${interval} ${plural}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** `YYYY-MM-DD` of an instant as seen in `timezone`. */
export function eventDayKey(iso: string | Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(typeof iso === 'string' ? new Date(iso) : iso);
}

/** "Hoje", "Amanhã", "Ontem" or "quarta-feira, 23 de outubro" for a day key. */
export function describeEventDay(dayKey: string, timezone: string): string {
  const today = eventDayKey(new Date(), timezone);
  const shift = (days: number) =>
    eventDayKey(new Date(Date.parse(`${today}T12:00:00Z`) + days * DAY_MS), 'UTC');

  if (dayKey === today) return 'Hoje';
  if (dayKey === shift(1)) return 'Amanhã';
  if (dayKey === shift(-1)) return 'Ontem';

  const sameYear = dayKey.slice(0, 4) === today.slice(0, 4);
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' }),
    timeZone: 'UTC',
  }).format(new Date(`${dayKey}T12:00:00Z`));
}

/** `datetime-local` value (`YYYY-MM-DDTHH:mm`) of an instant in `timezone`. */
export function toLocalInputValue(iso: string | Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(typeof iso === 'string' ? new Date(iso) : iso);
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}
