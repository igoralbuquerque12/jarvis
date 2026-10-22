export interface AlertVariable {
  token: string;
  label: string;
  description: string;
  sample: string;
}

export const SUGGESTED_ALERT_MESSAGE =
  'Olá, ${my_name}! A API monitorada apresentou falha em ${formated_timestamp} com código ${error_code} (${erro_translation}). Retorno da requisição: ${body_request}';

export const ALERT_VARIABLES: AlertVariable[] = [
  {
    token: '${my_name}',
    label: 'Seu nome',
    description: 'O nome cadastrado no seu perfil.',
    sample: 'Igor',
  },
  {
    token: '${error_code}',
    label: 'Código do erro',
    description: 'Código HTTP devolvido pela API (400, 500…) ou TIMEOUT.',
    sample: '500',
  },
  {
    token: '${erro_translation}',
    label: 'Erro em português',
    description: 'O significado do código HTTP, já traduzido.',
    sample: 'Erro interno do servidor (Internal Server Error)',
  },
  {
    token: '${formated_timestamp}',
    label: 'Data e hora',
    description: 'Quando a falha aconteceu, no fuso do seu perfil.',
    sample: '21/10/2026 15:30:00',
  },
  {
    token: '${body_request}',
    label: 'Resposta da API',
    description: 'O conteúdo que a API devolveu junto com o erro.',
    sample: '{"error":"Internal Server Error","service":"api"}',
  },
];

// Aliases the server also understands, so they must not be flagged as unknown.
const ALIASES: Record<string, string> = {
  '${formatted_timestamp}': '${formated_timestamp}',
  '${error_translation}': '${erro_translation}',
};

export const VARIABLE_PATTERN = /\$\{[^}\s]*\}/g;

export function canonicalToken(token: string): string {
  return ALIASES[token] ?? token;
}

export function findVariable(token: string): AlertVariable | undefined {
  const canonical = canonicalToken(token);
  return ALERT_VARIABLES.find((variable) => variable.token === canonical);
}

export interface TemplateSegment {
  text: string;
  /** Present when the segment is a `${...}` placeholder. */
  variable?: { known: boolean; sample?: string };
}

/** Splits a template into plain text and `${variable}` segments. */
export function splitTemplate(template: string): TemplateSegment[] {
  const segments: TemplateSegment[] = [];
  let cursor = 0;

  for (const match of template.matchAll(VARIABLE_PATTERN)) {
    const index = match.index ?? 0;
    if (index > cursor) {
      segments.push({ text: template.slice(cursor, index) });
    }
    const known = findVariable(match[0]);
    segments.push({
      text: match[0],
      variable: { known: Boolean(known), sample: known?.sample },
    });
    cursor = index + match[0].length;
  }

  if (cursor < template.length) {
    segments.push({ text: template.slice(cursor) });
  }

  return segments;
}

/** `https://api.com/` + `health` → `https://api.com/health`. */
export function buildDisplayUrl(url: string, endpoint: string): string {
  const cleanUrl = url.trim().replace(/\/+$/, '');
  const cleanEndpoint = endpoint.trim();
  if (!cleanEndpoint) return cleanUrl;
  return cleanEndpoint.startsWith('/')
    ? `${cleanUrl}${cleanEndpoint}`
    : `${cleanUrl}/${cleanEndpoint}`;
}
