import { Injectable, Logger } from '@nestjs/common';
import { MessageContentType, MessageType } from '@prisma/client';
import type { Profile } from '@prisma/client';

import { IncomingMessageDto } from '../dto/receive-message.dto';
import { ProfileService } from '../../profile/services/profile.service';
import { MessagesService } from '../../messages/services/messages.service';
import { AssistantWorkflowService } from './assistant-workflow.service';
import { AssistantConnectionService } from './assistant-connection.service';
import { AssistantRunService } from './assistant-run.service';
import { AssistantMessageService } from './assistant-message.service';
import { AssistantAudioService } from './assistant-audio.service';
import { AssistantAudioError } from '../errors/assistant-audio.error';
import { ASSISTANT_FALLBACK_REPLY } from '../constants/assistant-message.constant';

@Injectable()
export class AssistantMainService {
  private readonly logger = new Logger(AssistantMainService.name);

  constructor(
    private readonly profileService: ProfileService,
    private readonly messagesService: MessagesService,
    private readonly assistantWorkflowService: AssistantWorkflowService,
    private readonly assistantConnectionService: AssistantConnectionService,
    private readonly assistantRunService: AssistantRunService,
    private readonly assistantMessageService: AssistantMessageService,
    private readonly assistantAudioService: AssistantAudioService,
  ) {}

  async receiveMessage(data: IncomingMessageDto) {
    let runId: string | null = null;
    let profile: Profile | null = null;

    try {
      // toDo: validar campos possívelmente ausentes que o dto era pra ter validado mas a gente ta forçando a passagem no modulo do wpp. O modulo do wpp não tem obrigação de verificar, ele só passa.
      const currentMessage = data.text || '';

      profile = await this.profileService.findOne({ jid: data.from });
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

      const content = data.audio
        ? await this.assistantAudioService.transcribe(data.audio)
        : currentMessage;

      await this.messagesService.create({
        userId: profile.id,
        content,
        type: MessageType.user,
        contentType: data.audio
          ? MessageContentType.AUDIO
          : MessageContentType.TEXT,
        runId,
      });

      await this.assistantWorkflowService.fetch({ runId });

      if (!(await this.assistantMessageService.hasReplied(runId))) {
        this.logger.warn(
          `Run ${runId} finished without any message to the user; sending the fallback reply.`,
        );
        await this.assistantMessageService.deliver(
          profile,
          runId,
          ASSISTANT_FALLBACK_REPLY,
        );
      }

      await this.assistantRunService.complete(runId);

      return {
        ok: true,
        runId,
      };
    } catch (error) {
      this.logger.error('Error in receiveMessage', error);
      const reason = error instanceof Error ? error.message : 'Unknown error';

      if (runId && profile) {
        await this.assistantRunService
          .fail(runId, reason)
          .catch((failError: unknown) =>
            this.logger.error(
              `Could not mark run ${runId} as FAILED`,
              failError,
            ),
          );

        await this.apologize(profile, runId, error);
      }

      return {
        ok: false,
        error: reason,
      };
    }
  }

  /**
   * Best effort: a failed run that never said anything still owes the user an
   * answer. Skipped when the assistant already sent a message in the run.
   */
  private async apologize(profile: Profile, runId: string, error: unknown) {
    try {
      if (await this.assistantMessageService.hasReplied(runId)) {
        return;
      }

      await this.assistantMessageService.deliver(
        profile,
        runId,
        error instanceof AssistantAudioError
          ? error.userMessage
          : ASSISTANT_FALLBACK_REPLY,
      );
    } catch (replyError) {
      this.logger.error(
        `Could not send the fallback reply of run ${runId}`,
        replyError,
      );
    }
  }
}
