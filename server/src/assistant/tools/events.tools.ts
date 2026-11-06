import {
  AssistantTool,
  enumField,
  integerField,
  stringField,
  uuidField,
  dateField,
} from './tool.types';
import { ACTIVE_EVENT_FILTERS } from '../../events/constants/event-execution.constant';
import { PLAN_FEATURE_MIN_PLAN } from '../../subscription/constants/subscription-plans.constant';

const EVENT_TYPES = ['UNIQUE', 'RECURRENCE'] as const;
const RECURRENCE_MODES = ['HOUR', 'DAY', 'WEEK', 'MONTH'] as const;

export const EVENTS_TOOL: AssistantTool = {
  name: 'events',
  description:
    'Lembretes, rotinas e mensagens agendadas. Cada evento é uma mensagem que o Jarvis envia ao usuário no WhatsApp na data e hora combinadas.',
  whenToUse:
    'Quando o usuário quiser ser lembrado de algo, criar uma rotina, listar lembretes (recorrentes, de hoje, próximos 3, 7 ou 30 dias), alterar um lembrete ou cancelar/deletar um lembrete.',
  minPlan: PLAN_FEATURE_MIN_PLAN.eventsManagement,
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
          'Mensagem formatada de forma amigável que o Jarvis enviará ao usuário no momento do disparo, sempre no estilo "Oi, <nome>. Você me pediu para te lembrar de <ação>." (usando o nome do usuário em <perfil_do_usuario>), ex. "Oi, Igor. Você me pediu para te lembrar de lavar o carro.".',
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
        content:
          'Oi, Igor. Você me pediu para te lembrar de tomar o remédio da pressão.',
        recurrenceInterval: 1,
        recurrenceMode: 'DAY',
      },
      notes:
        'Sempre formate o campo content antes de salvar no estilo "Oi, <nome>. Você me pediu para te lembrar de <ação>." (ou "Oi! Você me pediu para te lembrar de <ação>." se não houver nome em <perfil_do_usuario>). Nunca envie recurrenceInterval ou recurrenceMode em eventos UNIQUE. Para "toda segunda" use RECURRENCE, interval 1, mode WEEK, começando na próxima segunda. O retorno traz scheduledAtLocal (hora efetivamente gravada, já arredondada e no fuso do usuário): confirme ao usuário esse horário, não o que ele pediu.',
    },
    {
      name: 'find_active_events',
      whenToUse:
        'Listar lembretes e rotinas pendentes com opções predefinidas ("buscar todos os recorrentes", "eventos de hoje", "próximos 3 dias", "próximos 7 dias", "próximos 30 dias" ou todos) ou de uma data específica.',
      fields: [
        enumField(
          'filter',
          ACTIVE_EVENT_FILTERS,
          'Opção predefinida de busca: "RECURRING" (todos os recorrentes), "TODAY" (eventos de hoje), "NEXT_3_DAYS" (próximos 3 dias), "NEXT_7_DAYS" (próximos 7 dias), "NEXT_30_DAYS" (próximos 30 dias) ou "ALL" (todos os pendentes).',
          false,
        ),
        dateField(
          'scheduledAt',
          'Dia específico (YYYY-MM-DD) no fuso do usuário, apenas quando ele pedir uma data avulsa fora das opções de filter.',
          false,
        ),
        enumField('type', EVENT_TYPES, 'Filtrar por tipo.', false),
      ],
      example: { filter: 'TODAY' },
      notes:
        'Use preferencialmente o campo filter com as opções definidas ("RECURRING", "TODAY", "NEXT_3_DAYS", "NEXT_7_DAYS", "NEXT_30_DAYS", "ALL"). Os eventos retornados ficam salvos automaticamente em <eventos_em_cache> para que na próxima mensagem ("deleta ele", "altera ele") você já tenha o eventSeriesId sem precisar buscar de novo.',
    },
    {
      name: 'update_event',
      whenToUse:
        'Alterar um lembrete ou rotina pendente (mudar horário/data, texto da mensagem ou recorrência). Se o evento alvo já estiver em <eventos_em_cache> (ex.: logo após listar os eventos de hoje), use diretamente o eventSeriesId do cache.',
      fields: [
        uuidField(
          'eventSeriesId',
          'Id da série (eventSeriesId em <eventos_em_cache> ou eventSeries.id retornado por find_active_events).',
        ),
        {
          name: 'startAt',
          type: 'string',
          format: 'date-time',
          required: false,
          description:
            'Nova data e hora do envio em ISO-8601 com o offset do fuso do usuário, ex. "2026-09-11T10:00:00-03:00". O sistema arredonda para o múltiplo de 10 minutos mais próximo.',
        },
        stringField(
          'content',
          'Novo texto do lembrete, formatado no estilo "Oi, <nome>. Você me pediu para te lembrar de <ação>.", ex. "Oi, Igor. Você me pediu para te lembrar de lavar o carro.".',
          false,
        ),
        enumField(
          'type',
          EVENT_TYPES,
          'Novo tipo ("UNIQUE" ou "RECURRENCE"), caso o usuário queira alterar a recorrência.',
          false,
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
        eventSeriesId: '5f0c2b3e-8f7a-4d0e-9a3b-2c1d4e5f6a7b',
        startAt: '2026-09-11T10:00:00-03:00',
        content: 'Oi, Igor. Você me pediu para te lembrar de lavar o carro.',
      },
      notes:
        'Envie apenas os campos que mudaram. Ao atualizar content, mantenha sempre a formatação "Oi, <nome>. Você me pediu para te lembrar de <ação>.". Confirme ao usuário usando o scheduledAtLocal retornado.',
    },
    {
      name: 'delete_event',
      whenToUse:
        'Cancelar/deletar um lembrete ou uma rotina inteira. Se o usuário acabou de buscar eventos ("busque os eventos de hoje") e disser "deleta ele" ou "cancela esse", use diretamente o eventSeriesId presente em <eventos_em_cache>.',
      fields: [
        uuidField(
          'eventSeriesId',
          'Id da série (eventSeriesId em <eventos_em_cache> ou eventSeries.id retornado por find_active_events).',
        ),
      ],
      example: { eventSeriesId: '5f0c2b3e-8f7a-4d0e-9a3b-2c1d4e5f6a7b' },
      notes:
        'Retorna cancelledExecutions com a quantidade de envios pendentes cancelados. Consulte <eventos_em_cache> primeiro; só chame find_active_events se o evento alvo não estiver no cache.',
    },
  ],
};
