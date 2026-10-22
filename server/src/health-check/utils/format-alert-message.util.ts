import { DateTime } from 'luxon';
import {
  HEALTH_CHECK_MAX_BODY_LENGTH,
  HTTP_ERROR_TRANSLATIONS_PT_BR,
} from '../constants/health-check.constant';

export interface AlertMessageVariables {
  myName: string;
  errorCode: string | number;
  occurredAt: Date;
  timezone: string;
  bodyRequest: string;
}

export function translateHttpErrorPtBr(errorCode: string | number): string {
  const key = String(errorCode).trim().toUpperCase();

  if (HTTP_ERROR_TRANSLATIONS_PT_BR[key]) {
    return HTTP_ERROR_TRANSLATIONS_PT_BR[key];
  }

  const numeric = Number(key);
  if (numeric >= 400 && numeric < 500) {
    return `Erro do cliente na requisição (HTTP ${numeric})`;
  }
  if (numeric >= 500 && numeric < 600) {
    return `Erro no servidor de destino (HTTP ${numeric})`;
  }

  return `Erro inesperado na requisição (${key})`;
}

export function formatTimestampForProfile(
  date: Date,
  timezone: string,
): string {
  const dt = DateTime.fromJSDate(date).setZone(timezone || 'America/Sao_Paulo');
  const validDt = dt.isValid
    ? dt
    : DateTime.fromJSDate(date).setZone('America/Sao_Paulo');

  return validDt.toFormat('dd/MM/yyyy HH:mm:ss');
}

export function sanitizeBodyRequest(rawBody: string): string {
  const trimmed = rawBody.trim();
  if (!trimmed) {
    return '(sem conteúdo no body)';
  }

  if (trimmed.length <= HEALTH_CHECK_MAX_BODY_LENGTH) {
    return trimmed;
  }

  return `${trimmed.slice(0, HEALTH_CHECK_MAX_BODY_LENGTH)}…`;
}

export function formatAlertMessage(
  template: string,
  variables: AlertMessageVariables,
): string {
  const errorCodeStr = String(variables.errorCode);
  const formattedTimestamp = formatTimestampForProfile(
    variables.occurredAt,
    variables.timezone,
  );
  const bodyRequest = sanitizeBodyRequest(variables.bodyRequest);
  const errorTranslation = translateHttpErrorPtBr(variables.errorCode);

  const replacements: Record<string, string> = {
    '${my_name}': variables.myName,
    '${error_code}': errorCodeStr,
    '${formated_timestamp}': formattedTimestamp,
    '${formatted_timestamp}': formattedTimestamp,
    '${body_request}': bodyRequest,
    '${erro_translation}': errorTranslation,
    '${error_translation}': errorTranslation,
  };

  return template.replace(
    /\$\{(my_name|error_code|formated_timestamp|formatted_timestamp|body_request|erro_translation|error_translation)\}/g,
    (match) => replacements[match] ?? match,
  );
}

export function buildHealthCheckUrl(url: string, endpoint?: string): string {
  const cleanUrl = url.trim().replace(/\/+$/, '');
  const cleanEndpoint = (endpoint ?? '').trim();

  if (!cleanEndpoint) {
    return cleanUrl;
  }

  const normalizedEndpoint = cleanEndpoint.startsWith('/')
    ? cleanEndpoint
    : `/${cleanEndpoint}`;

  return `${cleanUrl}${normalizedEndpoint}`;
}
