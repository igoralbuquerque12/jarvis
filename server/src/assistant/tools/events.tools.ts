export type AssistantToolEndpoint = {
  name: string;
  method: 'POST' | 'DELETE' | 'GET';
  path: string;
  whenToUse: string;
  request: Record<string, string>;
  response: string;
};

export type AssistantTool = {
  module: string;
  description: string;
  endpoints: AssistantToolEndpoint[];
};

export const EVENTS_TOOL: AssistantTool = {
  module: 'events',
  description:
    'Cria, remove e consulta mensagens agendadas do perfil atual. Eventos podem ser únicos ou recorrentes.',
  endpoints: [
    {
      name: 'create_event',
      method: 'POST',
      path: '/events-m2m/events',
      whenToUse:
        'Use quando o usuário pedir para criar um lembrete, envio agendado ou rotina recorrente.',
      request: {
        profileId:
          'Use sempre o profileId recebido no contexto do workflow; não peça este valor ao usuário.',
        type: 'UNIQUE para uma única execução ou RECURRENCE para uma rotina.',
        startAt:
          'Data e hora em ISO-8601. Quando não houver offset, informe também o timezone do usuário.',
        timezone: 'Timezone IANA, por exemplo America/Sao_Paulo.',
        content: 'Mensagem que deverá ser enviada no horário agendado.',
        recurrenceInterval:
          'Obrigatório somente para RECURRENCE: inteiro positivo que define o intervalo.',
        recurrenceMode:
          'Obrigatório somente para RECURRENCE: HOUR, DAY, WEEK ou MONTH.',
      },
      response:
        'Retorna { eventSeries, eventExecution }. A primeira execução inicia com status PENDING.',
    },
    {
      name: 'delete_event',
      method: 'DELETE',
      path: '/events-m2m/events/:eventSeriesId',
      whenToUse:
        'Use quando o usuário pedir para cancelar ou remover um evento agendado.',
      request: {
        eventSeriesId: 'Identificador da série de evento que será cancelada.',
      },
      response:
        'Retorna { eventSeries, cancelledExecutions }. A série fica inativa e pendências passam para CANCELLED.',
    },
    {
      name: 'list_active_events',
      method: 'GET',
      path: '/events-m2m/events',
      whenToUse:
        'Use quando o usuário pedir seus próximos eventos, eventos de um dia ou eventos por tipo.',
      request: {
        scheduledAt:
          'Opcional, no formato YYYY-MM-DD. Quando informado, timezone também é obrigatório.',
        timezone:
          'Timezone IANA usado para interpretar scheduledAt como um dia-calendário.',
        type: 'Opcional: UNIQUE ou RECURRENCE.',
      },
      response:
        'Retorna execuções PENDING ou PROCESSING de séries ativas, ordenadas por scheduledAt e com resumo da série.',
    },
  ],
};
