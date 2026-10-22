import { Injectable, Logger } from '@nestjs/common';
import { WhatsappSenderService } from '../../whatsapp/services/whatsapp-sender.service';
import { HEALTH_CHECK_REQUEST_TIMEOUT_MS } from '../constants/health-check.constant';
import {
  buildHealthCheckUrl,
  formatAlertMessage,
} from '../utils/format-alert-message.util';
import { HealthCheckCryptoService } from './health-check-crypto.service';
import {
  CachedHealthCheckConfig,
  HealthCheckService,
} from './health-check.service';

@Injectable()
export class HealthCheckExecutionService {
  private readonly logger = new Logger(HealthCheckExecutionService.name);

  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly cryptoService: HealthCheckCryptoService,
    private readonly whatsappSenderService: WhatsappSenderService,
  ) {}

  async runHealthChecks(): Promise<void> {
    const configs = await this.healthCheckService.getConfigsForExecution();

    if (configs.length === 0) {
      return;
    }

    for (const config of configs) {
      await this.checkSingleApi(config);
    }
  }

  private async checkSingleApi(config: CachedHealthCheckConfig): Promise<void> {
    const targetUrl = buildHealthCheckUrl(config.url, config.endpoint);
    const headers: Record<string, string> = {};

    if (config.authKey && config.authValue) {
      try {
        headers[config.authKey] = this.cryptoService.decrypt(config.authValue);
      } catch (error) {
        this.logger.error(
          `Failed to decrypt authValue for health check ${config.id}.`,
          error instanceof Error ? error.stack : undefined,
        );
        return;
      }
    }

    try {
      const response = await fetch(targetUrl, {
        method: config.httpMethod,
        headers,
        signal: AbortSignal.timeout(HEALTH_CHECK_REQUEST_TIMEOUT_MS),
      });

      // Status 2xx (e.g. 200 OK): do nothing and move on to the next API
      if (response.ok) {
        return;
      }

      const responseBody = await this.safeReadResponseBody(response);

      await this.sendFailureAlert(config, {
        errorCode: response.status,
        bodyRequest: responseBody,
      });
    } catch (error) {
      const isTimeout = this.isTimeoutError(error);
      const errorCode = isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR';
      const errorDetail =
        error instanceof Error
          ? error.message
          : 'Erro desconhecido ao conectar na API';

      await this.sendFailureAlert(config, {
        errorCode,
        bodyRequest: errorDetail,
      });
    }
  }

  private async sendFailureAlert(
    config: CachedHealthCheckConfig,
    failure: { errorCode: string | number; bodyRequest: string },
  ): Promise<void> {
    const { jid, name, timezone } = config.profile;

    if (!jid) {
      this.logger.warn(
        `Skipping WhatsApp alert for health check ${config.id}: profile ${config.profileId} has no paired JID.`,
      );
      return;
    }

    const message = formatAlertMessage(config.alertMessage, {
      myName: name,
      errorCode: failure.errorCode,
      occurredAt: new Date(),
      timezone,
      bodyRequest: failure.bodyRequest,
    });

    try {
      await this.whatsappSenderService.sendMessage(jid, message);
    } catch (error) {
      this.logger.error(
        `Failed to send health check alert for config ${config.id}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  private async safeReadResponseBody(response: Response): Promise<string> {
    try {
      return await response.text();
    } catch {
      return '';
    }
  }

  private isTimeoutError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const name = 'name' in error ? String(error.name) : '';
    return name === 'TimeoutError' || name === 'AbortError';
  }
}
