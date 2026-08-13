const rawApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:3000';

export const apiBaseUrl = rawApiBaseUrl.replace(/\/$/, '');

const rawWhatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER?.trim() ?? '';

/** Número do assistente somente com dígitos, ou null quando não configurado. */
export const assistantWhatsappNumber =
  rawWhatsappNumber.replace(/\D/g, '') || null;
