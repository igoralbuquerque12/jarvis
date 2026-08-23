import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

import { WhatsappConnectionService } from './whatsapp-connection.service';

@Injectable()
export class WhatsappSenderService {
  private readonly logger = new Logger(WhatsappSenderService.name);
  constructor(
    @Inject(forwardRef(() => WhatsappConnectionService))
    private readonly connection: WhatsappConnectionService,
  ) {}

  async sendMessage(jid: string, message: string): Promise<{ sent: true }> {
    const socket = this.connection.getSocket();
    if (!socket || !this.connection.isConnected()) {
      throw new ServiceUnavailableException('WhatsApp is not connected.');
    }

    try {
      await socket.sendMessage(jid, {
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
}
