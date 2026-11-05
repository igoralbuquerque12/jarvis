import type { Message } from '@prisma/client';
import type { KnowledgeIndexItem } from '../../database-information/entities/database-information-assistant.view';
import type { AssistantTool } from '../tools/tool.types';

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
  /**
   * Index of the user's knowledge bases (id, name, description). n8n renders it
   * as <bases_de_conhecimento>; the model picks one by description and reads
   * it with the `database_information` tool. Empty when the plan has no tool.
   */
  knowledge: KnowledgeIndexItem[];
  /** ISO-8601 with offset in the profile timezone. */
  now: string;
  /** pt-BR human readable form of `now`. */
  nowHuman: string;
  timezone: string;
}
