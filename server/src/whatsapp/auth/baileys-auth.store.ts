import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  AuthenticationCreds,
  AuthenticationState,
  SignalDataSet,
  SignalDataTypeMap,
  proto,
} from '@whiskeysockets/baileys';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsappAuthCryptoService } from '../crypto/whatsapp-auth-crypto.service';

type BaileysModule = typeof import('@whiskeysockets/baileys');

type BaileysAuthStoreResult = {
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
  clearAuth: () => Promise<void>;
};

@Injectable()
export class BaileysAuthStore {
  private readonly logger = new Logger(BaileysAuthStore.name);
  private baileysModule: BaileysModule | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: WhatsappAuthCryptoService,
  ) {}

  async createAuthenticationState(): Promise<BaileysAuthStoreResult> {
    const creds = await this.loadCreds();
    const state: AuthenticationState = {
      creds,
      keys: {
        get: async <T extends keyof SignalDataTypeMap>(
          type: T,
          ids: string[],
        ): Promise<{ [id: string]: SignalDataTypeMap[T] }> => {
          const keys = ids.map((id) => this.buildSignalKey(type, id));
          const records = await this.prisma.whatsappAuth.findMany({
            where: {
              key: {
                in: keys,
              },
            },
          });
          const recordsByKey = new Map(
            records.map((record) => [record.key, record.value]),
          );
          const result: { [id: string]: SignalDataTypeMap[T] } = {};

          for (const id of ids) {
            const recordValue = recordsByKey.get(this.buildSignalKey(type, id));

            if (recordValue === undefined) {
              continue;
            }

            const decrypted =
              await this.crypto.decrypt<SignalDataTypeMap[T]>(recordValue);

            result[id] = await this.restoreSignalValue(type, decrypted);
          }

          return result;
        },
        set: async (data: SignalDataSet): Promise<void> => {
          const entries = Object.entries(data) as Array<
            [
              keyof SignalDataTypeMap,
              Partial<
                Record<
                  string,
                  SignalDataTypeMap[keyof SignalDataTypeMap] | null | undefined
                >
              >,
            ]
          >;

          for (const [type, values] of entries) {
            for (const [id, value] of Object.entries(values)) {
              const key = this.buildSignalKey(type, id);

              if (value === null || value === undefined) {
                await this.prisma.whatsappAuth.deleteMany({
                  where: { key },
                });
                continue;
              }

              const encrypted = await this.crypto.encrypt(value);
              const jsonValue = this.toPrismaJson(encrypted);

              await this.prisma.whatsappAuth.upsert({
                where: { key },
                create: {
                  key,
                  value: jsonValue,
                },
                update: {
                  value: jsonValue,
                },
              });
            }
          }
        },
      },
    };

    return {
      state,
      saveCreds: async (): Promise<void> => {
        const encrypted = await this.crypto.encrypt(state.creds);
        const jsonValue = this.toPrismaJson(encrypted);

        await this.prisma.whatsappAuth.upsert({
          where: { key: 'creds' },
          create: {
            key: 'creds',
            value: jsonValue,
          },
          update: {
            value: jsonValue,
          },
        });
      },
      clearAuth: async (): Promise<void> => {
        await this.clearAuth();
      },
    };
  }

  async clearAuth(): Promise<void> {
    await this.prisma.whatsappAuth.deleteMany();
    this.logger.warn('WhatsApp authentication records were cleared.');
  }

  private async loadCreds(): Promise<AuthenticationCreds> {
    const record = await this.prisma.whatsappAuth.findUnique({
      where: { key: 'creds' },
    });

    if (!record) {
      const { initAuthCreds } = await this.getBaileysModule();
      return initAuthCreds();
    }

    return this.crypto.decrypt<AuthenticationCreds>(record.value);
  }

  private async restoreSignalValue<T extends keyof SignalDataTypeMap>(
    type: T,
    value: SignalDataTypeMap[T],
  ): Promise<SignalDataTypeMap[T]> {
    if (type !== 'app-state-sync-key') {
      return value;
    }

    const { proto: baileysProto } = await this.getBaileysModule();
    const restored = baileysProto.Message.AppStateSyncKeyData.fromObject(
      value as proto.Message.IAppStateSyncKeyData,
    );

    return restored as unknown as SignalDataTypeMap[T];
  }

  private buildSignalKey(type: keyof SignalDataTypeMap, id: string): string {
    return `${type}:${id}`;
  }

  private toPrismaJson(value: unknown): Prisma.InputJsonValue {
    return value as Prisma.InputJsonValue;
  }

  private async getBaileysModule(): Promise<BaileysModule> {
    if (!this.baileysModule) {
      this.baileysModule = await import('@whiskeysockets/baileys');
    }

    return this.baileysModule;
  }
}
