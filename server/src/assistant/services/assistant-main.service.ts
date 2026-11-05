import { Injectable, Logger } from '@nestjs/common';
import { MessageType } from '@prisma/client';

import { IncomingMessageDto } from '../dto/receive-message.dto';
import { ProfileService } from '../../profile/services/profile.service';
import { MessagesService } from '../../messages/services/messages.service';
import { AssistantWorkflowService } from './assistant-workflow.service';
import { WhatsappSenderService } from '../../whatsapp/services/whatsapp-sender.service';
import { AssistantConnectionService } from './assistant-connection.service';
import { AssistantRunService } from './assistant-run.service';

@Injectable()
export class AssistantMainService {
  private readonly logger = new Logger(AssistantMainService.name);

  constructor(
    private readonly profileService: ProfileService,
    private readonly messagesService: MessagesService,
    private readonly assistantWorkflowService: AssistantWorkflowService,
    private readonly whatsappSenderService: WhatsappSenderService,
    private readonly assistantConnectionService: AssistantConnectionService,
    private readonly assistantRunService: AssistantRunService,
  ) {}

  async receiveMessage(data: IncomingMessageDto) {
    let runId: string | null = null;

    try {
      // toDo: validar campos possívelmente ausentes que o dto era pra ter validado mas a gente ta forçando a passagem no modulo do wpp. O modulo do wpp não tem obrigação de verificar, ele só passa.
      const currentMessage = data.text || '';

      const profile = await this.profileService.findOne({ jid: data.from });
      if (!profile) {
        const connectionSuccess =
          await this.assistantConnectionService.connectionAttempt(
            currentMessage,
            data.from,
          );
        if (!connectionSuccess) {
          this.logger.warn(
            `Profile not found trying to connect with message: ${currentMessage}.`,
          );
          return {
            ok: false,
            error: 'Connection failed.',
          };
        }

        this.logger.log(`Profile connected successfully for a new user`);
        return {
          ok: true,
          error: 'Connection established successfully.',
        };
      }

      const run = await this.assistantRunService.start(
        profile.id,
        data.messageId,
      );
      if (!run) {
        this.logger.warn(
          `Duplicate WhatsApp message ${data.messageId} for profile ${profile.id}; skipped.`,
        );
        return { ok: true, duplicate: true };
      }
      runId = run.id;

      await this.messagesService.create({
        userId: profile.id,
        content: currentMessage,
        type: MessageType.user,
        runId,
      });

      // n8n reads context and tools back from /assistant-m2m/runs/:runId/*.
      const responseWorkflow = await this.assistantWorkflowService.fetch({
        runId,
      });
      this.logger.debug(
        `Workflow response for run ${runId}: ${responseWorkflow.response}`,
      );

      await this.messagesService.create({
        userId: profile.id,
        content: responseWorkflow.response,
        type: MessageType.AI,
        runId,
      });

      await this.whatsappSenderService.sendMessage(
        data.from,
        responseWorkflow.response,
      );

      await this.assistantRunService.complete(runId);

      return {
        ok: true,
        runId,
      };
    } catch (error) {
      this.logger.error('Error in receiveMessage', error);
      const reason = error instanceof Error ? error.message : 'Unknown error';

      if (runId) {
        await this.assistantRunService
          .fail(runId, reason)
          .catch((failError: unknown) =>
            this.logger.error(
              `Could not mark run ${runId} as FAILED`,
              failError,
            ),
          );
      }

      return {
        ok: false,
        error: reason,
      };
    }
  }
}
