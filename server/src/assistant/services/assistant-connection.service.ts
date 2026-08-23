import { Injectable } from '@nestjs/common';

import { ProfileService } from '../../profile/services/profile.service';
import { WhatsappSenderService } from '../../whatsapp/services/whatsapp-sender.service';

@Injectable()
export class AssistantConnectionService {
  constructor(
    private readonly profileService: ProfileService,
    private readonly whatsappSenderService: WhatsappSenderService,
  ) {}

  async connectionAttempt(message: string, jid: string): Promise<boolean> {
    const token = this.detectToken(message);
    if (!token) {
      return false;
    }

    const user = await this.profileService.findOne({ token });
    if (!user) {
      return false;
    }

    await this.profileService.update(user.id, { jid });

    await this.whatsappSenderService.sendMessage(
      jid,
      this.connectionSuccessResponse(user.name),
    );

    return true;
  }

  private detectToken(message: string): string | null {
    const match = message.match(/\b[A-Za-z0-9]{10}\b/);
    return match ? match[0] : null;
  }

  private connectionSuccessResponse(name: string): string {
    return `Oi, ${name}! Prazer, sou o Jarvis, sua conta foi conectada com sucesso. Vai ser um prazer te ajudar!`;
  }
}
