import {
  buildHealthCheckUrl,
  formatAlertMessage,
  translateHttpErrorPtBr,
} from './format-alert-message.util';

describe('format-alert-message.util', () => {
  describe('translateHttpErrorPtBr', () => {
    it('returns Portuguese translations for known status codes and timeout', () => {
      expect(translateHttpErrorPtBr(400)).toContain('Requisição inválida');
      expect(translateHttpErrorPtBr(401)).toContain('Não autorizado');
      expect(translateHttpErrorPtBr(421)).toContain(
        'Requisição direcionada incorretamente',
      );
      expect(translateHttpErrorPtBr(500)).toContain('Erro interno do servidor');
      expect(translateHttpErrorPtBr(501)).toContain(
        'Funcionalidade não implementada',
      );
      expect(translateHttpErrorPtBr('TIMEOUT')).toContain(
        'Tempo limite da requisição excedido',
      );
    });

    it('falls back gracefully for unmapped 4xx and 5xx codes', () => {
      expect(translateHttpErrorPtBr(499)).toBe(
        'Erro do cliente na requisição (HTTP 499)',
      );
      expect(translateHttpErrorPtBr(599)).toBe(
        'Erro no servidor de destino (HTTP 599)',
      );
    });
  });

  describe('formatAlertMessage', () => {
    it('replaces all dynamic variables in the alertMessage template', () => {
      const template =
        'Olá ${my_name}, erro ${error_code} (${erro_translation}) em ${formated_timestamp}. Body: ${body_request}';

      const occurredAt = new Date('2026-10-21T18:30:00.000Z');
      const result = formatAlertMessage(template, {
        myName: 'Igor',
        errorCode: 500,
        occurredAt,
        timezone: 'America/Sao_Paulo',
        bodyRequest: '{"message":"Database connection failed"}',
      });

      expect(result).toBe(
        'Olá Igor, erro 500 (Erro interno do servidor (Internal Server Error)) em 21/10/2026 15:30:00. Body: {"message":"Database connection failed"}',
      );
    });

    it('handles empty body_request gracefully', () => {
      const result = formatAlertMessage('Body=${body_request}', {
        myName: 'Igor',
        errorCode: 400,
        occurredAt: new Date('2026-10-21T18:30:00.000Z'),
        timezone: 'America/Sao_Paulo',
        bodyRequest: '   ',
      });

      expect(result).toBe('Body=(sem conteúdo no body)');
    });
  });

  describe('buildHealthCheckUrl', () => {
    it('concatenates base url and endpoint cleanly regardless of slashes', () => {
      expect(
        buildHealthCheckUrl('https://api.example.com/', '/v1/health'),
      ).toBe('https://api.example.com/v1/health');
      expect(buildHealthCheckUrl('https://api.example.com', 'v1/health')).toBe(
        'https://api.example.com/v1/health',
      );
      expect(buildHealthCheckUrl('https://api.example.com/', '')).toBe(
        'https://api.example.com',
      );
    });
  });
});
