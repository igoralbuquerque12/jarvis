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
