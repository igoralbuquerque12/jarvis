export type AssistantToolOperation = {
  /** Exact operation name. For one-tool-per-operation modules it is also the tool name. */
  name: string;
  whenToUse: string;
  /** One line per field: "field (type, obrigatório|opcional): meaning". */
  params: string[];
  /** Example of the `data` object the operation expects. */
  example: Record<string, unknown>;
  notes?: string;
};

export type AssistantToolEndpoint = {
  name: string;
  method: 'POST' | 'DELETE' | 'GET' | 'PATCH';
  path: string;
  whenToUse: string;
  request: Record<string, string>;
  response: string;
  /**
   * When set, every operation goes through a single tool with this name and
   * the fields `operation` + `data`. When absent, each operation is exposed
   * as its own tool (named after the operation) with typed fields.
   */
  rpcToolName?: string;
  operations: AssistantToolOperation[];
};

export type AssistantTool = {
  module: string;
  description: string;
  endpoints: AssistantToolEndpoint[];
};

export const EVENTS_TOOL: AssistantTool = {
  module: 'events',
  description:
    'Lembretes, rotinas e mensagens agendadas. Cada evento é uma mensagem que o Jarvis envia ao usuário no WhatsApp na data e hora combinadas.',
  endpoints: [
    {
      name: 'execute_events_operation',
      method: 'POST',
      path: '/events-m2m/:profileId/execute',
      whenToUse:
        'Sempre que o usuário quiser ser lembrado de algo, criar uma rotina, ver o que está agendado ou cancelar um lembrete.',
      request: {
        profileId: 'Obrigatório: vem do contexto, no parâmetro de rota.',
        operation: 'Obrigatório: nome da operação.',
        data: 'Objeto com os campos da operação (ver operações).',
      },
      response: 'Resultado da operação.',
      operations: [
        {
          name: 'create_event',
          whenToUse:
            'Criar um lembrete único ("me lembra amanhã às 9h de...") ou uma rotina recorrente ("todo dia às 8h", "toda segunda", "a cada 2 horas").',
          params: [
            'type (string, obrigatório): "UNIQUE" para um único envio ou "RECURRENCE" para repetição.',
            'startAt (string, obrigatório): data e hora do primeiro envio em ISO-8601 com offset do fuso do usuário, ex. "2026-09-11T09:00:00-03:00". O horário é arredondado para o múltiplo de 10 minutos mais próximo.',
            'content (string, obrigatório): o texto exato do lembrete, escrito como uma mensagem para o usuário, ex. "Ligar para o dentista".',
            'recurrenceInterval (number, obrigatório apenas para RECURRENCE): quantas unidades entre repetições, ex. 1. Omitir para UNIQUE.',
            'recurrenceMode (string, obrigatório apenas para RECURRENCE): unidade da repetição: "HOUR", "DAY", "WEEK" ou "MONTH". Omitir para UNIQUE.',
          ],
          example: {
            type: 'RECURRENCE',
            startAt: '2026-09-11T08:00:00-03:00',
            content: 'Tomar o remédio da pressão',
            recurrenceInterval: 1,
            recurrenceMode: 'DAY',
          },
          notes:
            'Nunca envie recurrenceInterval ou recurrenceMode em eventos UNIQUE. Para "toda segunda" use RECURRENCE com interval 1 e mode WEEK começando na próxima segunda.',
        },
        {
          name: 'find_active_events',
          whenToUse:
            'Listar lembretes e rotinas pendentes ("o que tenho agendado?", "quais lembretes de amanhã?") e obter o eventSeriesId antes de cancelar algo.',
          params: [
            'scheduledAt (string, opcional): dia no formato "YYYY-MM-DD" para filtrar apenas envios daquele dia, no fuso do usuário.',
            'type (string, opcional): "UNIQUE" ou "RECURRENCE" para filtrar por tipo.',
          ],
          example: { scheduledAt: '2026-09-11' },
          notes:
            'Retorna uma lista de execuções pendentes com id, content, scheduledAt (UTC), status e eventSeries { id, type, recurrenceInterval, recurrenceMode }. Use eventSeries.id como eventSeriesId em delete_event.',
        },
        {
          name: 'delete_event',
          whenToUse:
            'Cancelar um lembrete ou uma rotina inteira. Se não souber o id, consulte find_active_events primeiro e confirme com o usuário qual item cancelar.',
          params: [
            'eventSeriesId (string, obrigatório): id da série (eventSeries.id retornado por find_active_events).',
          ],
          example: { eventSeriesId: '5f0c2b3e-8f7a-4d0e-9a3b-2c1d4e5f6a7b' },
        },
      ],
    },
  ],
};
