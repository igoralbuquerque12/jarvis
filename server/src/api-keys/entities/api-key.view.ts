import type { ApiKey } from '@prisma/client';

/** What the web client sees. The hash never leaves the server. */
export interface ApiKeyView {
  id: string;
  name: string;
  prefix: string;
  active: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
}

/** Returned only once, right after creation. */
export interface CreatedApiKeyView extends ApiKeyView {
  secret: string;
}

export function toApiKeyView(apiKey: ApiKey): ApiKeyView {
  return {
    id: apiKey.id,
    name: apiKey.name,
    prefix: apiKey.prefix,
    active: apiKey.active,
    lastUsedAt: apiKey.lastUsedAt,
    createdAt: apiKey.createdAt,
  };
}
