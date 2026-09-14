/** Date helpers for `YYYY-MM-DD` strings in the browser's local time. */

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export interface YearMonth {
  year: number;
  /** 1-12 */
  month: number;
}

export function currentYearMonth(): YearMonth {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function shiftYearMonth(ym: YearMonth, delta: number): YearMonth {
  const date = new Date(ym.year, ym.month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function isSameYearMonth(a: YearMonth, b: YearMonth): boolean {
  return a.year === b.year && a.month === b.month;
}

/** First and last day of the month as ISO dates. */
export function monthRange(ym: YearMonth): { from: string; to: string } {
  const lastDay = new Date(ym.year, ym.month, 0).getDate();
  return {
    from: `${ym.year}-${pad(ym.month)}-01`,
    to: `${ym.year}-${pad(ym.month)}-${pad(lastDay)}`,
  };
}

export function formatYearMonth(ym: YearMonth): string {
  const label = new Date(ym.year, ym.month - 1, 1).toLocaleString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatISODate(
  iso: string,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' },
): string {
  return new Intl.DateTimeFormat('pt-BR', options)
    .format(parseISODate(iso))
    .replace('.', '');
}

/** "Hoje", "Ontem" or a weekday + date label for list group headers. */
export function describeISODate(iso: string): string {
  const today = todayISO();
  if (iso === today) return 'Hoje';

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (iso === toISODate(yesterday)) return 'Ontem';

  const label = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(parseISODate(iso));
  return label.replaceAll('.', '');
}

export function timeOfDayGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}
