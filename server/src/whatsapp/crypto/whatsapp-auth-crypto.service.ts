import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

type BaileysModule = typeof import('@whiskeysockets/baileys');

export type EncryptedPayload = {
  version: 1;
  algorithm: 'aes-256-gcm';
  iv: string;
  authTag: string;
  ciphertext: string;
};

@Injectable()
export class WhatsappAuthCryptoService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;
  private baileysModule: BaileysModule | null = null;

  constructor(configService: ConfigService) {
    const keyBase64 = configService.get<string>('WHATSAPP_AUTH_ENCRYPTION_KEY');

    if (!keyBase64) {
      throw new Error(
        'WHATSAPP_AUTH_ENCRYPTION_KEY environment variable is required.',
      );
    }

    const key = Buffer.from(keyBase64, 'base64');

    if (key.length !== 32) {
      throw new Error(
        'WHATSAPP_AUTH_ENCRYPTION_KEY must decode to exactly 32 bytes.',
      );
    }

    this.key = key;
  }

  async encrypt(value: unknown): Promise<EncryptedPayload> {
    const { BufferJSON } = await this.getBaileysModule();
    const serialized = JSON.stringify(value, BufferJSON.replacer);
    const iv = randomBytes(12);
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(serialized, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return {
      version: 1,
      algorithm: this.algorithm,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      ciphertext: ciphertext.toString('base64'),
    };
  }

  async decrypt<T>(payload: unknown): Promise<T> {
    this.assertEncryptedPayload(payload);

    const iv = Buffer.from(payload.iv, 'base64');
    const authTag = Buffer.from(payload.authTag, 'base64');
    const ciphertext = Buffer.from(payload.ciphertext, 'base64');
    const decipher = createDecipheriv(this.algorithm, this.key, iv);

    decipher.setAuthTag(authTag);

    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString('utf8');

    const { BufferJSON } = await this.getBaileysModule();

    return JSON.parse(plaintext, BufferJSON.reviver) as T;
  }

  private async getBaileysModule(): Promise<BaileysModule> {
    if (!this.baileysModule) {
      this.baileysModule = await import('@whiskeysockets/baileys');
    }

    return this.baileysModule;
  }

  private assertEncryptedPayload(
    payload: unknown,
  ): asserts payload is EncryptedPayload {
    if (!this.isEncryptedPayload(payload)) {
      throw new Error('Invalid encrypted WhatsApp auth payload.');
    }
  }

  private isEncryptedPayload(payload: unknown): payload is EncryptedPayload {
    if (typeof payload !== 'object' || payload === null) {
      return false;
    }

    const candidate = payload as Record<string, unknown>;

    return (
      candidate.version === 1 &&
      candidate.algorithm === this.algorithm &&
      typeof candidate.iv === 'string' &&
      typeof candidate.authTag === 'string' &&
      typeof candidate.ciphertext === 'string'
    );
  }
}
