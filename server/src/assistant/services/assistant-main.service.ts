import { Injectable, Logger } from '@nestjs/common';
import { MessageType } from '@prisma/client/edge';

import { IncomingMessageDto } from '../dto/receive-message.dto';
import { ProfileService } from '../../profile/services/profile.service';
import { MessagesService } from '../../messages/services/messages.service';
import { DEFAULT_DIRECTIVE } from '../config/guideline.config';
import { AssistantWorkflowService } from './assistant-workflow.service';
import { WhatsappSenderService } from '../../whatsapp/services/whatsapp-sender.service';
import { AssistantConnectionService } from './assistant-connection.service';
import { ASSISTANT_TOOLS } from '../tools/main.tools';

@Injectable()
export class AssistantMainService {
  private readonly logger = new Logger(AssistantMainService.name);

  constructor(
    private readonly profileService: ProfileService,
    private readonly messagesService: MessagesService,
    private readonly assistantWorkflowService: AssistantWorkflowService,
    private readonly whatsappSenderService: WhatsappSenderService,
    private readonly assistantConnectionService: AssistantConnectionService,
  ) {}

  async receiveMessage(data: IncomingMessageDto) {
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

      const lastMessages = await this.messagesService.findAll({
        userId: profile.id,
        take: 10,
      });

      await this.messagesService.create({
        userId: profile.id,
        content: currentMessage,
        type: MessageType.user,
      });

      const workflowInput = {
        directive: DEFAULT_DIRECTIVE,
        profileId: profile.id,
        profileContext: profile.about,
        currentMessage: currentMessage,
        lastMessages,
        tools: ASSISTANT_TOOLS,
      };
      console.log('Workflow input:', JSON.stringify(workflowInput));
      const responseWorkflow =
        await this.assistantWorkflowService.fetch(workflowInput);
      console.log('Response from workflow:', responseWorkflow);
      await this.messagesService.create({
        userId: profile.id,
        content: responseWorkflow.response,
        type: MessageType.AI,
      });

      await this.whatsappSenderService.sendMessage(
        data.from,
        responseWorkflow.response,
      );

      return {
        ok: true,
      };
    } catch (error) {
      console.error('Error in receiveMessage:', error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
