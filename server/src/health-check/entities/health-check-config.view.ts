import type { HealthCheckConfig, HealthCheckHttpMethod } from '@prisma/client';

/**
 * Representation returned to the authenticated web panel.
 * The encrypted authValue never leaves the server; `hasAuthValue` indicates
 * whether an encrypted credential is stored.
 */
export interface HealthCheckConfigView {
  id: string;
  name: string;
  url: string;
  httpMethod: HealthCheckHttpMethod;
  endpoint: string;
  authKey: string | null;
  hasAuthValue: boolean;
  alertMessage: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function toHealthCheckConfigView(
  config: HealthCheckConfig,
): HealthCheckConfigView {
  return {
    id: config.id,
    name: config.name,
    url: config.url,
    httpMethod: config.httpMethod,
    endpoint: config.endpoint,
    authKey: config.authKey,
    hasAuthValue: Boolean(config.authValue),
    alertMessage: config.alertMessage,
    active: config.active,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  };
}
