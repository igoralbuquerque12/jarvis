import { ConflictException, Injectable } from '@nestjs/common';
import type { Profile } from '@prisma/client';
import { isWhatsappLinked } from '../../profile/entities/profile-me.view';
import { WhatsappSenderService } from '../../whatsapp/services/whatsapp-sender.service';

export interface SentMessageView {
  sent: true;
  sentAt: Date;
}

@Injectable()
export class PublicApiService {
  constructor(private readonly whatsappSender: WhatsappSenderService) {}

  /** Delivers a message from Jarvis to the key owner's own WhatsApp. */
  async sendMessageToSelf(
    profile: Profile,
    message: string,
  ): Promise<SentMessageView> {
    if (!isWhatsappLinked(profile)) {
      throw new ConflictException(
        'Este perfil ainda não vinculou um número de WhatsApp.',
      );
    }

    await this.whatsappSender.sendMessage(profile.jid, message.trim());

    return { sent: true, sentAt: new Date() };
  }
}
