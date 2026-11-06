export function getEventsGuideline(): string {
  return [
    'Para criar um evento, extraia profileId, content e startAt.',
    'Formate sempre o content de forma amigável antes de salvar, no estilo: "Oi, $nome. Você me pediu para te lembrar de <ação>.".',
    'Use type UNIQUE para um único envio.',
    'Use type RECURRENCE para eventos repetidos e informe recurrenceInterval e recurrenceMode (HOUR, DAY, WEEK ou MONTH).',
    'Para listar eventos, utilize as opções de filter: RECURRING, TODAY, NEXT_3_DAYS, NEXT_7_DAYS, NEXT_30_DAYS ou ALL.',
    'Use update_event para alterar horário, conteúdo ou recorrência de um evento pendente e delete_event para cancelá-lo.',
    'Sempre envie startAt em ISO-8601.',
    'O horário será normalizado para o intervalo de 10 minutos mais próximo.',
  ].join('\n');
}
