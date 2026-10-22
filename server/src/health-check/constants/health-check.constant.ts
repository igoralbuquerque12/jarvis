import { CronExpression } from '@nestjs/schedule';

/** Cron schedule interval for checking all saved APIs (every 30 minutes). */
export const HEALTH_CHECK_CRON_EXPRESSION = CronExpression.EVERY_30_MINUTES;

/** Redis cache key for saved HealthCheckConfig records. */
export const HEALTH_CHECK_CACHE_KEY = 'health-check:configs:cache';

/** Cache persistence duration in seconds (3 days). */
export const HEALTH_CHECK_CACHE_TTL_SECONDS = 3 * 24 * 60 * 60;

/** Maximum timeout per health check HTTP request (10 seconds). */
export const HEALTH_CHECK_REQUEST_TIMEOUT_MS = 10_000;

/** Maximum response body snippet length injected into ${body_request}. */
export const HEALTH_CHECK_MAX_BODY_LENGTH = 500;

/**
 * Portuguese (pt-BR) translations for HTTP error status codes and failure types
 * used by the ${erro_translation} dynamic variable.
 */
export const HTTP_ERROR_TRANSLATIONS_PT_BR: Record<string, string> = {
  '400': 'Requisição inválida (Bad Request)',
  '401': 'Não autorizado (Unauthorized)',
  '402': 'Pagamento necessário (Payment Required)',
  '403': 'Acesso negado / Proibido (Forbidden)',
  '404': 'Recurso não encontrado (Not Found)',
  '405': 'Método HTTP não permitido (Method Not Allowed)',
  '406': 'Não aceitável (Not Acceptable)',
  '407': 'Autenticação de proxy necessária (Proxy Authentication Required)',
  '408': 'Tempo limite da requisição esgotado (Request Timeout)',
  '409': 'Conflito na requisição (Conflict)',
  '410': 'Recurso indisponível permanentemente (Gone)',
  '411': 'Comprimento obrigatório (Length Required)',
  '412': 'Pré-condição falhou (Precondition Failed)',
  '413': 'Carga útil muito grande (Payload Too Large)',
  '414': 'URI muito longa (URI Too Long)',
  '415': 'Tipo de mídia não suportado (Unsupported Media Type)',
  '421': 'Requisição direcionada incorretamente (Misdirected Request)',
  '422': 'Entidade improcessável (Unprocessable Entity)',
  '423': 'Recurso bloqueado (Locked)',
  '424': 'Falha de dependência (Failed Dependency)',
  '426': 'Atualização necessária (Upgrade Required)',
  '428': 'Pré-condição obrigatória (Precondition Required)',
  '429': 'Muitas requisições / Limite excedido (Too Many Requests)',
  '431': 'Campos de cabeçalho muito grandes (Request Header Fields Too Large)',
  '451': 'Indisponível por motivos legais (Unavailable For Legal Reasons)',
  '500': 'Erro interno do servidor (Internal Server Error)',
  '501': 'Funcionalidade não implementada (Not Implemented)',
  '502': 'Gateway inválido (Bad Gateway)',
  '503': 'Serviço indisponível (Service Unavailable)',
  '504': 'Tempo limite do gateway esgotado (Gateway Timeout)',
  '505': 'Versão HTTP não suportada (HTTP Version Not Supported)',
  TIMEOUT: 'Tempo limite da requisição excedido (Timeout)',
  NETWORK_ERROR: 'Falha de conexão ou erro de rede com o servidor',
};
