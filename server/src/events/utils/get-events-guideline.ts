export function getEventsGuideline(): string {
  return [
    'Para criar um evento, extraia profileId, content, startAt e timezone IANA.',
    'Use type UNIQUE para um único envio.',
    'Use type RECURRENCE para eventos repetidos e informe recurrenceInterval e recurrenceMode (HOUR, DAY, WEEK ou MONTH).',
    'Sempre envie startAt em ISO-8601 e preserve o fuso informado pelo usuário.',
    'O horário será normalizado para o intervalo de 10 minutos mais próximo.',
  ].join('\n');
}
