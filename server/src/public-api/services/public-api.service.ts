import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Profile } from '@prisma/client';
import { RedisService } from '../../redis/services/redis.service';
import { isWhatsappLinked } from '../../profile/entities/profile-me.view';
import { WhatsappSenderService } from '../../whatsapp/services/whatsapp-sender.service';

export interface SentMessageView {
  sent: true;
  sentAt: Date;
}

@Injectable()
export class PublicApiService {
  constructor(
    private readonly whatsappSender: WhatsappSenderService,
    private readonly redisService: RedisService,
  ) {}

  /** Delivers a message from Jarvis to the key owner's own WhatsApp. */
  async sendMessageToSelf(
    apiKeyId: string,
    profile: Profile,
    message: string,
  ): Promise<SentMessageView> {
    const rateLimitKey = `public-api:messages:rate-limit:${apiKeyId}`;
    const acquired = await this.redisService
      .getClient()
      .set(rateLimitKey, '1', {
        NX: true,
        EX: 60,
      });

    if (acquired !== 'OK') {
      throw new HttpException(
        'Rate limit exceeded. Please try again in one minute.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!isWhatsappLinked(profile)) {
      throw new ConflictException(
        'Este perfil ainda não vinculou um número de WhatsApp.',
      );
    }

    await this.whatsappSender.sendMessage(profile.jid, message.trim());

    return { sent: true, sentAt: new Date() };
  }
}
