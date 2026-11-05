/** Maximum number of knowledge bases a single profile may hold. */
export const MAX_DATABASE_INFORMATION_PER_PROFILE = 10;

export const DATABASE_INFORMATION_MAX_CONTENT_LENGTH = 20_000;
export const DATABASE_INFORMATION_MAX_NAME_LENGTH = 80;
export const DATABASE_INFORMATION_MAX_DESCRIPTION_LENGTH = 300;

/** The extraction runs inside the HTTP request, so the budget is tight. */
export const DATABASE_INFORMATION_AI_TIMEOUT_MS = 15_000;
export const DATABASE_INFORMATION_AI_MAX_ATTEMPTS = 2;

export const DATABASE_INFORMATION_EXTRACTION_INSTRUCTIONS = [
  'Analise a base de dados em texto abaixo e extraia:',
  `- name: um nome objetivo para a base, com no máximo 5 palavras e ${DATABASE_INFORMATION_MAX_NAME_LENGTH} caracteres.`,
  `- description: uma descrição objetiva do que a base trata, com no máximo 2 frases e ${DATABASE_INFORMATION_MAX_DESCRIPTION_LENGTH} caracteres.`,
  'Escreva em português e descreva apenas o que está no conteúdo.',
].join('\n');
