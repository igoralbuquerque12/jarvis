import { Injectable } from '@nestjs/common';
import { WhatsappConnectionService } from './whatsapp-connection.service';
import { WhatsappSenderService } from './whatsapp-sender.service';

/** Fachada temporária para manter os controllers e consumidores atuais estáveis. */
@Injectable()
export class WhatsappService {
  constructor(
    private readonly connection: WhatsappConnectionService,
    private readonly sender: WhatsappSenderService,
  ) {}

  getQr(): Promise<{ connected: boolean; qr: string | null }> {
    return this.connection.getQr();
  }

  isConnected(): boolean {
    return this.connection.isConnected();
  }

  sendMessage(phone: string, message: string): Promise<{ sent: true }> {
    return this.sender.sendMessage(phone, message);
  }
}
