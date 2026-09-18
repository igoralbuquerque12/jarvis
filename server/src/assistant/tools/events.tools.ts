import {
  AssistantTool,
  enumField,
  integerField,
  stringField,
  uuidField,
  dateField,
} from './tool.types';

const EVENT_TYPES = ['UNIQUE', 'RECURRENCE'] as const;
const RECURRENCE_MODES = ['HOUR', 'DAY', 'WEEK', 'MONTH'] as const;

export const EVENTS_TOOL: AssistantTool = {
  name: 'events',
  description:
    'Lembretes, rotinas e mensagens agendadas. Cada evento é uma mensagem que o Jarvis envia ao usuário no WhatsApp na data e hora combinadas.',
  whenToUse:
    'Quando o usuário quiser ser lembrado de algo, criar uma rotina, ver o que está agendado ou cancelar um lembrete.',
  path: '/events-m2m/:profileId/execute',
  operations: [
    {
      name: 'create_event',
      whenToUse:
        'Criar um lembrete único ("me lembra amanhã às 9h de...") ou uma rotina recorrente ("todo dia às 8h", "toda segunda", "a cada 2 horas").',
      fields: [
        enumField(
          'type',
          EVENT_TYPES,
          '"UNIQUE" para um único envio ou "RECURRENCE" para repetição.',
        ),
        {
          name: 'startAt',
          type: 'string',
          format: 'date-time',
          required: true,
          description:
            'Data e hora do primeiro envio em ISO-8601 com o offset do fuso do usuário, ex. "2026-09-11T09:00:00-03:00". O sistema arredonda para o múltiplo de 10 minutos mais próximo.',
        },
        stringField(
          'content',
          'Texto exato do lembrete, escrito como mensagem para o usuário, ex. "Ligar para o dentista".',
        ),
        integerField(
          'recurrenceInterval',
          'Somente para RECURRENCE: quantas unidades entre repetições, ex. 1.',
          false,
        ),
        enumField(
          'recurrenceMode',
          RECURRENCE_MODES,
          'Somente para RECURRENCE: unidade da repetição.',
          false,
        ),
      ],
      example: {
        type: 'RECURRENCE',
        startAt: '2026-09-11T08:00:00-03:00',
        content: 'Tomar o remédio da pressão',
        recurrenceInterval: 1,
        recurrenceMode: 'DAY',
      },
      notes:
        'Nunca envie recurrenceInterval ou recurrenceMode em eventos UNIQUE. Para "toda segunda" use RECURRENCE, interval 1, mode WEEK, começando na próxima segunda. O retorno traz scheduledAtLocal (hora efetivamente gravada, já arredondada e no fuso do usuário): confirme ao usuário esse horário, não o que ele pediu.',
    },
    {
      name: 'find_active_events',
      whenToUse:
        'Listar lembretes e rotinas pendentes ("o que tenho agendado?", "quais lembretes de amanhã?") e obter o eventSeries.id antes de cancelar algo.',
      fields: [
        dateField(
          'scheduledAt',
          'Dia no fuso do usuário para filtrar apenas envios daquele dia.',
          false,
        ),
        enumField('type', EVENT_TYPES, 'Filtrar por tipo.', false),
      ],
      example: { scheduledAt: '2026-09-11' },
      notes:
        'Retorna uma lista de execuções pendentes com id, content, scheduledAtLocal (fuso do usuário), status e eventSeries { id, type, recurrenceInterval, recurrenceMode }. Use eventSeries.id como eventSeriesId em delete_event.',
    },
    {
      name: 'delete_event',
      whenToUse:
        'Cancelar um lembrete ou uma rotina inteira, usando o eventSeries.id obtido em find_active_events.',
      fields: [
        uuidField(
          'eventSeriesId',
          'Id da série (eventSeries.id retornado por find_active_events).',
        ),
      ],
      example: { eventSeriesId: '5f0c2b3e-8f7a-4d0e-9a3b-2c1d4e5f6a7b' },
      notes:
        'Retorna cancelledExecutions com a quantidade de envios pendentes cancelados.',
    },
  ],
};
