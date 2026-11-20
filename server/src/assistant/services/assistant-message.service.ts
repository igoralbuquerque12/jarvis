import { ConflictException, Injectable } from '@nestjs/common';
import { MessageType } from '@prisma/client';
import type { Profile } from '@prisma/client';

import { MessagesService } from '../../messages/services/messages.service';
import { WhatsappSenderService } from '../../whatsapp/services/whatsapp-sender.service';
import { AssistantRunService } from './assistant-run.service';

/**
 * Every message the assistant sends to the user during a run goes through
 * here: delivered on WhatsApp first, then persisted as an `AI` message of the
 * run (so the history only holds what was really sent). A run can send as
 * many messages as it wants; the n8n webhook response carries none.
 */
@Injectable()
export class AssistantMessageService {
  constructor(
    private readonly assistantRunService: AssistantRunService,
    private readonly messagesService: MessagesService,
    private readonly whatsappSenderService: WhatsappSenderService,
  ) {}

  /** Backend side of the n8n `enviar_mensagem` tool. */
  async sendForRun(runId: string, content: string): Promise<{ sent: true }> {
    const { profile } = await this.assistantRunService.findActive(runId);

    await this.deliver(profile, runId, content);

    return { sent: true };
  }

  /** Sends `content` to the profile's WhatsApp and records it on the run. */
  async deliver(
    profile: Pick<Profile, 'id' | 'jid'>,
    runId: string,
    content: string,
  ): Promise<void> {
    if (!profile.jid) {
      throw new ConflictException('O usuário não tem WhatsApp vinculado.');
    }

    await this.whatsappSenderService.sendMessage(profile.jid, content);
    await this.messagesService.create({
      userId: profile.id,
      content,
      type: MessageType.AI,
      runId,
    });
  }

  /** Whether the assistant already sent the user something in this run. */
  async hasReplied(runId: string): Promise<boolean> {
    return (await this.messagesService.countAiMessagesOfRun(runId)) > 0;
  }
}
