import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import type {
  AuthenticationCreds,
  ConnectionState,
  DisconnectReason,
  WASocket,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';
import { setTimeout as delay } from 'node:timers/promises';
import { BaileysAuthStore } from '../auth/baileys-auth.store';
import { WhatsappReceiverService } from './whatsapp-receiver.service';

type BaileysModule = typeof import('@whiskeysockets/baileys');

@Injectable()
export class WhatsappConnectionService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(WhatsappConnectionService.name);
  private socket: WASocket | null = null;
  private currentQr: string | null = null;
  private connected = false;
  private connecting = false;
  private reconnecting = false;
  private shuttingDown = false;
  private saveCredsHandler:
    ((creds: Partial<AuthenticationCreds>) => void) | null = null;
  private baileysModule: BaileysModule | null = null;

  constructor(
    private readonly authStore: BaileysAuthStore,
    private readonly receiver: WhatsappReceiverService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    this.shuttingDown = true;
    await this.disconnect();
  }

  async getQr(): Promise<{ connected: boolean; qr: string | null }> {
    return {
      connected: this.connected,
      qr: this.currentQr ? await QRCode.toDataURL(this.currentQr) : null,
    };
  }

  isConnected(): boolean {
    return this.connected;
  }

  getSocket(): WASocket | null {
    return this.socket;
  }

  private async connect(): Promise<void> {
    if (this.connecting) return;
    this.connecting = true;
    try {
      await this.closeExistingSocket();
      const { state, saveCreds } =
        await this.authStore.createAuthenticationState();
      const { makeWASocket } = await this.getBaileysModule();
      const socket = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
      });

      this.socket = socket;
      this.connected = false;
      this.saveCredsHandler = (): void => {
        void saveCreds().catch((error: unknown) => {
          this.logger.error(
            'Failed to persist WhatsApp credentials.',
            this.getErrorMessage(error),
          );
        });
      };

      socket.ev.on('creds.update', this.saveCredsHandler);
      socket.ev.on('connection.update', this.handleConnectionUpdate);
      socket.ev.on('messages.upsert', this.receiver.handleMessagesUpsert);
      this.logger.log('WhatsApp socket initialized.');
    } catch (error) {
      this.logger.error(
        'Failed to initialize WhatsApp socket.',
        this.getErrorMessage(error),
      );
      throw error;
    } finally {
      this.connecting = false;
    }
  }

  private async disconnect(): Promise<void> {
    this.connected = false;
    this.currentQr = null;
    await this.closeExistingSocket();
  }

  private readonly handleConnectionUpdate = (
    update: Partial<ConnectionState>,
  ): void => {
    void this.processConnectionUpdate(update).catch((error: unknown) => {
      this.logger.error(
        'Failed to process WhatsApp connection update.',
        this.getErrorMessage(error),
      );
    });
  };

  private async processConnectionUpdate(
    update: Partial<ConnectionState>,
  ): Promise<void> {
    const { DisconnectReason: disconnectReason } =
      await this.getBaileysModule();
    if (update.qr) {
      this.currentQr = update.qr;
      this.connected = false;
      this.logger.log('WhatsApp QR Code received.');
    }
    if (update.connection === 'open') {
      this.currentQr = null;
      this.connected = true;
      this.logger.log('WhatsApp connected.');
      return;
    }
    if (update.connection !== 'close') return;

    this.connected = false;
    if (this.shuttingDown) return;

    const statusCode = this.getDisconnectStatusCode(
      update.lastDisconnect?.error,
    );
    if (statusCode === disconnectReason.loggedOut) {
      this.logger.warn(
        `WhatsApp logged out. Clearing authentication state. Reason: ${this.getErrorMessage(update.lastDisconnect?.error) ?? 'unknown'}.`,
      );
      await this.authStore.clearAuth();
      this.currentQr = null;
    } else {
      this.logger.warn(
        `WhatsApp connection closed. Reconnecting. Status: ${statusCode ?? 'unknown'}.`,
      );
    }
    void this.reconnect();
  }

  private async reconnect(): Promise<void> {
    if (this.reconnecting || this.shuttingDown) return;
    this.reconnecting = true;
    try {
      await delay(3000);
      if (!this.shuttingDown) await this.connect();
    } finally {
      this.reconnecting = false;
    }
  }

  private async closeExistingSocket(): Promise<void> {
    const socket = this.socket;
    if (!socket) return;
    socket.ev.off('connection.update', this.handleConnectionUpdate);
    socket.ev.off('messages.upsert', this.receiver.handleMessagesUpsert);
    if (this.saveCredsHandler) {
      socket.ev.off('creds.update', this.saveCredsHandler);
      this.saveCredsHandler = null;
    }
    this.socket = null;
    try {
      await socket.end(undefined);
    } catch (error) {
      this.logger.warn(
        'Failed to close previous WhatsApp socket cleanly.',
        this.getErrorMessage(error),
      );
    }
  }

  private async getBaileysModule(): Promise<BaileysModule> {
    this.baileysModule ??= await import('@whiskeysockets/baileys');
    return this.baileysModule;
  }

  private getDisconnectStatusCode(
    error: unknown,
  ): DisconnectReason | undefined {
    if (typeof error !== 'object' || error === null || !('output' in error))
      return undefined;
    const output = (error as { output?: { statusCode?: unknown } }).output;
    return typeof output?.statusCode === 'number'
      ? output.statusCode
      : undefined;
  }

  private getErrorMessage(error: unknown): string | undefined {
    return error instanceof Error ? error.message : undefined;
  }
}
