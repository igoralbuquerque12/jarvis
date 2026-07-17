import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { WASocket } from '@whiskeysockets/baileys';
import { WhatsappConnectionService } from './whatsapp-connection.service';

type BaileysModule = typeof import('@whiskeysockets/baileys');

@Injectable()
export class WhatsappSenderService {
  private readonly logger = new Logger(WhatsappSenderService.name);
  private baileysModule: BaileysModule | null = null;

  constructor(private readonly connection: WhatsappConnectionService) {}

  async sendMessage(phone: string, message: string): Promise<{ sent: true }> {
    const socket = this.connection.getSocket();
    if (!socket || !this.connection.isConnected()) {
      throw new ServiceUnavailableException('WhatsApp is not connected.');
    }

    try {
      await socket.sendMessage(await this.toWhatsappJid(socket, phone), {
        text: message,
      });
      return { sent: true };
    } catch (error) {
      this.logger.error(
        'Failed to send WhatsApp message.',
        error instanceof Error ? error.message : undefined,
      );
      throw new InternalServerErrorException(
        'Failed to send WhatsApp message.',
      );
    }
  }

  private async toWhatsappJid(
    socket: WASocket,
    phone: string,
  ): Promise<string> {
    const requestedJid = `124687933767789@lid`; // TESTE
    const { areJidsSameUser, jidDecode, jidNormalizedUser } =
      await this.getBaileysModule();
    const ownContact = socket.authState.creds.me ?? socket.user;
    const ownJids = [
      ownContact?.phoneNumber,
      ownContact?.id,
      ownContact?.lid,
    ].filter((jid): jid is string => Boolean(jid));
    const isOwnNumber = ownJids.some((ownJid) => {
      const ownUser = jidDecode(ownJid)?.user;
      return ownUser === phone || areJidsSameUser(requestedJid, ownJid);
    });

    return isOwnNumber
      ? jidNormalizedUser(ownContact?.phoneNumber ?? ownContact?.id)
      : requestedJid;
  }

  private async getBaileysModule(): Promise<BaileysModule> {
    this.baileysModule ??= await import('@whiskeysockets/baileys');
    return this.baileysModule;
  }
}
