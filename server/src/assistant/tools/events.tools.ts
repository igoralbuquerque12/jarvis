export type AssistantToolEndpoint = {
  name: string;
  method: 'POST' | 'DELETE' | 'GET' | 'PATCH';
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
    'Gerencia as rotinas, lembretes e agendamentos de mensagens do perfil. Tudo é concentrado em uma única rota RPC.',
  endpoints: [
    {
      name: 'execute_events_operation',
      method: 'POST',
      path: '/events-m2m/:profileId/execute',
      whenToUse:
        'Sempre que o usuário quiser criar, excluir ou consultar eventos ou rotinas.',
      request: {
        profileId:
          'Obrigatório: profileId extraído do contexto no parâmetro de rota.',
        operation: 'Obrigatório: Nome da operação.',
        data:
          'Objeto de dados dependendo da operação. Operações suportadas:\n' +
          '- create_event: { type ("UNIQUE" ou "RECURRENCE"), startAt, content, recurrenceInterval, recurrenceMode }\n' +
          '- delete_event: { eventSeriesId }\n' +
          '- find_active_events: { scheduledAt (opcional), type (opcional) }\n' +
          '- get_guideline: {} (sem parâmetros adicionais)',
      },
      response: 'Retorna o resultado da respectiva operação.',
    },
  ],
};
