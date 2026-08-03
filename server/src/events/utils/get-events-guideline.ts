export function getEventsGuideline(): string {
  return [
    'Para criar um evento, extraia profileId, content e startAt.',
    'Use type UNIQUE para um único envio.',
    'Use type RECURRENCE para eventos repetidos e informe recurrenceInterval e recurrenceMode (HOUR, DAY, WEEK ou MONTH).',
    'Sempre envie startAt em ISO-8601.',
    'O horário será normalizado para o intervalo de 10 minutos mais próximo.',
  ].join('\n');
}
