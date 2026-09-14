import { DateTime } from 'luxon';

import { DEFAULT_DIRECTIVE } from '../config/guideline.config';
import type {
  AssistantTool,
  AssistantToolEndpoint,
  AssistantToolOperation,
} from '../tools/events.tools';

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

function renderOperation(
  operation: AssistantToolOperation,
  endpoint: AssistantToolEndpoint,
): string[] {
  const example = endpoint.rpcToolName
    ? `operation="${operation.name}", data=${JSON.stringify(operation.example)}`
    : JSON.stringify(operation.example);

  const lines = [
    `### ${operation.name}`,
    `Quando usar: ${operation.whenToUse}`,
    'Campos:',
    ...operation.params.map((param) => `- ${param}`),
    `Exemplo: ${example}`,
  ];

  if (operation.notes) {
    lines.push(`Observação: ${operation.notes}`);
  }

  return lines;
}

function renderEndpoint(endpoint: AssistantToolEndpoint): string[] {
  const exposure = endpoint.rpcToolName
    ? `Ferramenta única: "${endpoint.rpcToolName}", com os campos "operation" (nome exato da operação) e "data" (os campos da operação como um objeto JSON serializado em string; use "{}" quando não houver parâmetros).`
    : 'Uma ferramenta por operação, com o mesmo nome da operação e os campos listados abaixo.';

  const lines = [exposure, `Quando usar: ${endpoint.whenToUse}`];
  for (const operation of endpoint.operations) {
    lines.push('', ...renderOperation(operation, endpoint));
  }
  return lines;
}

export function renderToolsReference(tools: AssistantTool[]): string {
  const sections = tools.map((tool) =>
    [
      `## Módulo ${tool.module}: ${tool.description}`,
      ...tool.endpoints.flatMap((endpoint) => renderEndpoint(endpoint)),
    ].join('\n'),
  );

  return [
    '# Ferramentas disponíveis',
    'Use os nomes e os campos exatamente como descritos. Omita campos opcionais que não se aplicam. Quando uma operação precisar de um id, obtenha-o primeiro com a operação de listagem correspondente.',
    ...sections,
  ].join('\n\n');
}

/** Static instructions + tool reference. Dynamic context is appended by n8n. */
export function buildDirective(tools: AssistantTool[]): string {
  return `${DEFAULT_DIRECTIVE}\n\n${renderToolsReference(tools)}`;
}
