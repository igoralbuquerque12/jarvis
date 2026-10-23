/** DI token for the vendor adapter picked by `AI_PROVIDER` (before retry). */
export const AI_BASE_PROVIDER = Symbol('AI_BASE_PROVIDER');

export const AI_PROVIDER_NAMES = ['openai', 'groq'] as const;
export type AiProviderName = (typeof AI_PROVIDER_NAMES)[number];

export const AI_DEFAULT_PROVIDER: AiProviderName = 'openai';
/** Retry policy and per-attempt timeout shared by every provider. */
export const AI_MAX_ATTEMPTS = 3;
export const AI_RETRY_BASE_MS = 500;
export const AI_TIMEOUT_MS = 30_000;

export const AI_EXTRACTION_SYSTEM_PROMPT = [
  'Você extrai informações estruturadas do conteúdo fornecido pelo usuário.',
  'Responda somente com um JSON válido que siga exatamente o schema informado.',
  'Use null quando a informação não existir no conteúdo; nunca invente valores.',
].join(' ');
