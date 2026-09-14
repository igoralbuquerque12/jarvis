export const FREQUENCY_LABELS: Record<string, string> = {
  monthly: 'Mensal',
  weekly: 'Semanal',
  yearly: 'Anual',
  daily: 'Diária',
};

export const FREQUENCY_OPTIONS = Object.entries(FREQUENCY_LABELS).map(
  ([value, label]) => ({ value, label }),
);

/** How many times a frequency occurs in a month, for rough monthly totals. */
export const MONTHLY_FACTOR: Record<string, number> = {
  daily: 30,
  weekly: 4.33,
  monthly: 1,
  yearly: 1 / 12,
};
