import { Injectable, Logger } from '@nestjs/common';
import { MessageType } from '@prisma/client/edge';

import { IncomingMessageDto } from '../dto/receive-message.dto';
import { ProfileService } from '../../profile/services/profile.service';
import { MessagesService } from '../../messages/services/messages.service';
import { AssistantWorkflowService } from './assistant-workflow.service';
import { WhatsappSenderService } from '../../whatsapp/services/whatsapp-sender.service';
import { AssistantConnectionService } from './assistant-connection.service';
import { AssistantToolsService } from './assistant-tools.service';
import { SubscriptionService } from '../../subscription/services/subscription.service';
import { buildTemporalContext } from '../utils/build-system-prompt';
import type { ReceiveMessageWorkflowInput } from '../entities/receive-message-workflow-input';

const HISTORY_SIZE = 10;

@Injectable()
export class AssistantMainService {
  private readonly logger = new Logger(AssistantMainService.name);

  constructor(
    private readonly profileService: ProfileService,
    private readonly messagesService: MessagesService,
    private readonly assistantWorkflowService: AssistantWorkflowService,
    private readonly whatsappSenderService: WhatsappSenderService,
    private readonly assistantConnectionService: AssistantConnectionService,
    private readonly assistantToolsService: AssistantToolsService,
    private readonly subscriptionService: SubscriptionService,
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

      const history = await this.messagesService.findAll({
        userId: profile.id,
        take: HISTORY_SIZE,
      });
      const lastMessages = history.map(({ type, content, createdAt }) => ({
        type,
        content,
        createdAt,
      }));

      await this.messagesService.create({
        userId: profile.id,
        content: currentMessage,
        type: MessageType.user,
      });

      const plan = await this.subscriptionService.findPlanNumber(
        profile.subscriptionId,
      );
      const { directive, tools } = this.assistantToolsService.forPlan(plan);

      const workflowInput: ReceiveMessageWorkflowInput = {
        directive,
        profileId: profile.id,
        profileContext: profile.about,
        currentMessage,
        lastMessages,
        tools,
        ...buildTemporalContext(profile.timezone),
      };
      this.logger.debug(
        `Workflow input for profile ${profile.id} (plan ${plan}): ${JSON.stringify(
          {
            ...workflowInput,
            directive: `[${directive.length} chars]`,
            tools: tools.map((tool) => tool.name),
          },
        )}`,
      );

      const responseWorkflow =
        await this.assistantWorkflowService.fetch(workflowInput);
      this.logger.debug(`Workflow response: ${responseWorkflow.response}`);

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
      this.logger.error('Error in receiveMessage', error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
