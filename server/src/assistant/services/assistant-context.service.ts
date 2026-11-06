import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';

import { DatabaseInformationService } from '../../database-information/services/database-information.service';
import { EventsM2mService } from '../../events/services/events-m2m.service';
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
const EVENTS_TOOL_NAME = 'events';

/** What n8n reads back for a run: the conversation context and the tools. */
@Injectable()
export class AssistantContextService {
  constructor(
    private readonly assistantRunService: AssistantRunService,
    private readonly assistantToolsService: AssistantToolsService,
    private readonly messagesService: MessagesService,
    private readonly databaseInformationService: DatabaseInformationService,
    private readonly eventsM2mService: EventsM2mService,
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
    const cachedEvents = tools.some((tool) => tool.name === EVENTS_TOOL_NAME)
      ? await this.eventsM2mService.getCachedEvents(profile.id)
      : [];

    const profileName = profile.name.trim();
    const profileContext = [
      profileName ? `Nome: ${profileName}` : '',
      profile.about.trim(),
    ]
      .filter(Boolean)
      .join('\n');

    const sessionKey = createHash('sha256')
      .update(`jarvis-assistant-session:${profile.id}`)
      .digest('hex')
      .slice(0, 32);

    return {
      directive: DEFAULT_DIRECTIVE,
      profileName,
      profileContext,
      sessionKey,
      currentMessage: currentMessage?.content ?? '',
      lastMessages: history.map(({ type, content, createdAt }) => ({
        type,
        content,
        createdAt,
      })),
      knowledge,
      cachedEvents,
      ...buildTemporalContext(profile.timezone),
    };
  }

  async getTools(runId: string): Promise<AssistantRunTools> {
    const { profile } = await this.assistantRunService.findActive(runId);

    return this.assistantToolsService.forProfile(profile);
  }
}
