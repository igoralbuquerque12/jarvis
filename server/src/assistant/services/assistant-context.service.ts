import { Injectable } from '@nestjs/common';

import { DatabaseInformationService } from '../../database-information/services/database-information.service';
import { MessagesService } from '../../messages/services/messages.service';
import { DEFAULT_DIRECTIVE } from '../config/guideline.config';
import type {
  AssistantRunContext,
  AssistantRunTools,
} from '../entities/assistant-run-context';
import { buildTemporalContext } from '../utils/build-system-prompt';
import { AssistantRunService } from './assistant-run.service';
import { AssistantToolsService } from './assistant-tools.service';

const HISTORY_SIZE = 10;
const KNOWLEDGE_TOOL_NAME = 'database_information';

/** What n8n reads back for a run: the conversation context and the tools. */
@Injectable()
export class AssistantContextService {
  constructor(
    private readonly assistantRunService: AssistantRunService,
    private readonly assistantToolsService: AssistantToolsService,
    private readonly messagesService: MessagesService,
    private readonly databaseInformationService: DatabaseInformationService,
  ) {}

  async getContext(runId: string): Promise<AssistantRunContext> {
    const { id, profile, startedAt } =
      await this.assistantRunService.findActive(runId);

    const currentMessage = await this.messagesService.findUserMessageOfRun(id);
    const history = await this.messagesService.findAll({
      userId: profile.id,
      take: HISTORY_SIZE,
      before: currentMessage?.createdAt ?? startedAt,
    });

    const { tools } = await this.assistantToolsService.forProfile(profile);
    const knowledge = tools.some((tool) => tool.name === KNOWLEDGE_TOOL_NAME)
      ? await this.databaseInformationService.findIndexByProfile(profile.id)
      : [];

    return {
      directive: DEFAULT_DIRECTIVE,
      profileContext: profile.about,
      currentMessage: currentMessage?.content ?? '',
      lastMessages: history.map(({ type, content, createdAt }) => ({
        type,
        content,
        createdAt,
      })),
      knowledge,
      ...buildTemporalContext(profile.timezone),
    };
  }

  async getTools(runId: string): Promise<AssistantRunTools> {
    const { profile } = await this.assistantRunService.findActive(runId);

    return this.assistantToolsService.forProfile(profile);
  }
}
