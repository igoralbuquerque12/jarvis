import { DateTime } from 'luxon';

import { DEFAULT_DIRECTIVE } from '../config/guideline.config';
import type {
  AssistantTool,
  ToolField,
  ToolOperation,
} from '../tools/tool.types';

export const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

export type TemporalContext = {
  /** ISO-8601 with offset in the profile timezone, e.g. 2026-09-10T14:30:00-03:00 */
  now: string;
  /** Human readable pt-BR, e.g. "quinta-feira, 10 de setembro de 2026 às 14:30" */
  nowHuman: string;
  timezone: string;
};

export function buildTemporalContext(
  timezone: string,
  reference: Date = new Date(),
): TemporalContext {
  let zone = timezone;
  let dt = DateTime.fromJSDate(reference).setZone(zone);
  if (!dt.isValid) {
    zone = DEFAULT_TIMEZONE;
    dt = DateTime.fromJSDate(reference).setZone(zone);
  }

  return {
    now: dt.toISO({ suppressMilliseconds: true }) ?? dt.toString(),
    nowHuman: dt
      .setLocale('pt-BR')
      .toFormat("cccc, d 'de' LLLL 'de' yyyy 'às' HH:mm"),
    timezone: zone,
  };
}

function typeLabel(field: ToolField): string {
  if (field.enum) {
    return field.enum.map((value) => `"${value}"`).join(' | ');
  }
  switch (field.format) {
    case 'uuid':
      return 'uuid';
    case 'date':
      return 'string "YYYY-MM-DD"';
    case 'date-time':
      return 'string ISO-8601 com offset';
    case 'color':
      return 'string "#RRGGBB"';
    default:
      return field.type;
  }
}

function renderField(field: ToolField): string {
  const requirement = field.required ? 'obrigatório' : 'opcional';
  return `- ${field.name} (${typeLabel(field)}, ${requirement}): ${field.description}`;
}

function renderOperation(operation: ToolOperation): string[] {
  const lines = [
    `### ${operation.name}`,
    `Quando usar: ${operation.whenToUse}`,
  ];

  if (operation.fields.length === 0) {
    lines.push('Campos: nenhum; envie data={}.');
  } else {
    lines.push('Campos:', ...operation.fields.map(renderField));
  }

  lines.push(
    `Exemplo: operation="${operation.name}", data=${JSON.stringify(operation.example)}`,
  );

  if (operation.notes) {
    lines.push(`Observação: ${operation.notes}`);
  }

  return lines;
}

function renderTool(tool: AssistantTool): string {
  const lines = [
    `## Ferramenta "${tool.name}": ${tool.description}`,
    `Quando usar: ${tool.whenToUse}`,
    `Operações: ${tool.operations.map((operation) => operation.name).join(', ')}.`,
  ];

  for (const operation of tool.operations) {
    lines.push('', ...renderOperation(operation));
  }

  return lines.join('\n');
}

export function renderToolsReference(tools: AssistantTool[]): string {
  return [
    '# Ferramentas disponíveis',
    'Toda ferramenta recebe "operation" (nome exato de uma das operações dela) e "data" (objeto com os campos da operação; {} quando não houver). Omita campos opcionais que não se aplicam. Quando uma operação precisar de um id, obtenha-o antes com a operação de listagem da mesma ferramenta. Nunca use uma operação em uma ferramenta que não a lista.',
    ...tools.map(renderTool),
  ].join('\n\n');
}

/** Static instructions + tool reference. Dynamic context is appended by n8n. */
export function buildDirective(tools: AssistantTool[]): string {
  return `${DEFAULT_DIRECTIVE}\n\n${renderToolsReference(tools)}`;
}
