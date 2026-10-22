import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { HealthCheckCryptoService } from './health-check-crypto.service';

describe('HealthCheckCryptoService', () => {
  const validKeyBase64 = randomBytes(32).toString('base64');

  function makeService(key?: string) {
    const configService = {
      get: jest.fn().mockReturnValue(key),
    } as unknown as ConfigService;

    return new HealthCheckCryptoService(configService);
  }

  it('encrypts and decrypts authValue preserving exact header value', () => {
    const service = makeService(validKeyBase64);
    const rawHeaderValue = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret';

    const encrypted = service.encrypt(rawHeaderValue);
    expect(encrypted).not.toContain(rawHeaderValue);

    const decrypted = service.decrypt(encrypted);
    expect(decrypted).toBe(rawHeaderValue);
  });

  it('throws if HEALTH_CHECK_AUTH_ENCRYPTION_KEY is missing or not 32 bytes', () => {
    expect(() => makeService(undefined)).toThrow(
      'HEALTH_CHECK_AUTH_ENCRYPTION_KEY environment variable is required.',
    );
    expect(() => makeService(Buffer.from('short').toString('base64'))).toThrow(
      'HEALTH_CHECK_AUTH_ENCRYPTION_KEY must decode to exactly 32 bytes.',
    );
  });
});

