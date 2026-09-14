import type { Message } from '@prisma/client';
import type { AssistantTool } from '../tools/events.tools';

export type WorkflowHistoryMessage = Pick<
  Message,
  'type' | 'content' | 'createdAt'
>;

export class ReceiveMessageWorkflowInput {
  /** Static instructions + tool reference (see build-system-prompt.ts). */
  directive: string;
  profileId: string;
  profileContext: string;
  currentMessage?: string;
  /** Newest first, as returned by MessagesService.findAll. */
  lastMessages: WorkflowHistoryMessage[];
  tools: AssistantTool[];
  /** ISO-8601 with offset in the profile timezone. */
  now: string;
  /** pt-BR human readable form of `now`. */
  nowHuman: string;
  timezone: string;
}
