import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export interface EncryptedHealthCheckAuthPayload {
  version: 1;
  algorithm: 'aes-256-gcm';
  iv: string;
  authTag: string;
  ciphertext: string;
}

@Injectable()
export class HealthCheckCryptoService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(configService: ConfigService) {
    const keyBase64 = configService.get<string>(
      'HEALTH_CHECK_AUTH_ENCRYPTION_KEY',
    );

    if (!keyBase64) {
      throw new Error(
        'HEALTH_CHECK_AUTH_ENCRYPTION_KEY environment variable is required.',
      );
    }

    const key = Buffer.from(keyBase64, 'base64');

    if (key.length !== 32) {
      throw new Error(
        'HEALTH_CHECK_AUTH_ENCRYPTION_KEY must decode to exactly 32 bytes.',
      );
    }

    this.key = key;
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    const payload: EncryptedHealthCheckAuthPayload = {
      version: 1,
      algorithm: this.algorithm,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      ciphertext: ciphertext.toString('base64'),
    };

    return JSON.stringify(payload);
  }

  decrypt(encryptedString: string): string {
    let parsed: unknown;
    try {
      parsed = JSON.parse(encryptedString);
    } catch {
      throw new Error('Invalid encrypted health check auth payload.');
    }

    this.assertEncryptedPayload(parsed);

    const iv = Buffer.from(parsed.iv, 'base64');
    const authTag = Buffer.from(parsed.authTag, 'base64');
    const ciphertext = Buffer.from(parsed.ciphertext, 'base64');
    const decipher = createDecipheriv(this.algorithm, this.key, iv);

    decipher.setAuthTag(authTag);

    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString('utf8');
  }

  private assertEncryptedPayload(
    payload: unknown,
  ): asserts payload is EncryptedHealthCheckAuthPayload {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid encrypted health check auth payload.');
    }

    const candidate = payload as Record<string, unknown>;

    if (
      candidate.version !== 1 ||
      candidate.algorithm !== this.algorithm ||
      typeof candidate.iv !== 'string' ||
      typeof candidate.authTag !== 'string' ||
      typeof candidate.ciphertext !== 'string'
    ) {
      throw new Error('Invalid encrypted health check auth payload.');
    }
  }
}
