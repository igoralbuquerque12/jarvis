import { HealthCheckHttpMethod } from '@prisma/client';
import { WhatsappSenderService } from '../../whatsapp/services/whatsapp-sender.service';
import { HealthCheckCryptoService } from './health-check-crypto.service';
import { HealthCheckExecutionService } from './health-check-execution.service';
import {
  CachedHealthCheckConfig,
  HealthCheckService,
} from './health-check.service';

describe('HealthCheckExecutionService', () => {
  let executionService: HealthCheckExecutionService;
  let healthCheckService: { getConfigsForExecution: jest.Mock };
  let cryptoService: { decrypt: jest.Mock };
  let whatsappSenderService: { sendMessage: jest.Mock };
  const originalFetch = global.fetch;

  const baseConfig: CachedHealthCheckConfig = {
    id: 'cfg-1',
    profileId: 'prof-1',
    name: 'API Principal',
    url: 'https://api.exemplo.com',
    httpMethod: HealthCheckHttpMethod.POST,
    endpoint: '/v1/health',
    authKey: 'Authorization',
    authValue: 'encrypted-token',
    alertMessage:
      'Olá ${my_name}! Erro ${error_code} (${erro_translation}) - Body: ${body_request}',
    profile: {
      id: 'prof-1',
      name: 'Igor',
      jid: '5511999999999@s.whatsapp.net',
      timezone: 'America/Sao_Paulo',
      active: true,
    },
  };

  beforeEach(() => {
    healthCheckService = {
      getConfigsForExecution: jest.fn(),
    };
    cryptoService = {
      decrypt: jest.fn().mockReturnValue('Bearer my-secret-token'),
    };
    whatsappSenderService = {
      sendMessage: jest.fn().mockResolvedValue({ sent: true }),
    };

    executionService = new HealthCheckExecutionService(
      healthCheckService as unknown as HealthCheckService,
      cryptoService as unknown as HealthCheckCryptoService,
      whatsappSenderService as unknown as WhatsappSenderService,
    );
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('does nothing when the API responds with status 200', async () => {
    healthCheckService.getConfigsForExecution.mockResolvedValue([baseConfig]);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue('{"status":"ok"}'),
    });

    await executionService.runHealthChecks();

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.exemplo.com/v1/health',
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'Bearer my-secret-token' },
      }),
    );
    expect(whatsappSenderService.sendMessage).not.toHaveBeenCalled();
  });

  it('sends formatted alertMessage via WhatsApp when API returns 500', async () => {
    healthCheckService.getConfigsForExecution.mockResolvedValue([baseConfig]);
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: jest.fn().mockResolvedValue('{"error":"DB down"}'),
    });

    await executionService.runHealthChecks();

    expect(whatsappSenderService.sendMessage).toHaveBeenCalledWith(
      '5511999999999@s.whatsapp.net',
      'Olá Igor! Erro 500 (Erro interno do servidor (Internal Server Error)) - Body: {"error":"DB down"}',
    );
  });

  it('sends formatted alertMessage with TIMEOUT when request times out', async () => {
    healthCheckService.getConfigsForExecution.mockResolvedValue([baseConfig]);
    const timeoutErr = new Error('The operation was aborted due to timeout');
    timeoutErr.name = 'TimeoutError';
    global.fetch = jest.fn().mockRejectedValue(timeoutErr);

    await executionService.runHealthChecks();

    expect(whatsappSenderService.sendMessage).toHaveBeenCalledWith(
      '5511999999999@s.whatsapp.net',
      'Olá Igor! Erro TIMEOUT (Tempo limite da requisição excedido (Timeout)) - Body: The operation was aborted due to timeout',
    );
  });
});
