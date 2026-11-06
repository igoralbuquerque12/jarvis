import type { Message } from '@prisma/client';
import type { KnowledgeIndexItem } from '../../database-information/entities/database-information-assistant.view';
import type { CachedAssistantEvent } from '../../events/types/event-execution.types';
import type { AssistantTool } from '../tools/tool.types';

export type WorkflowHistoryMessage = Pick<
  Message,
  'type' | 'content' | 'createdAt'
>;

/** `GET /assistant-m2m/runs/:runId/context`. */
export interface AssistantRunContext {
  /** Static instructions (guideline.config.ts), without the tool reference. */
  directive: string;
  profileName: string;
  profileContext: string;
  /** Opaque per-profile session key used by n8n memory without exposing profileId. */
  sessionKey: string;
  currentMessage: string;
  /** Messages before the current one, newest first. */
  lastMessages: WorkflowHistoryMessage[];
  /**
   * Index of the user's knowledge bases (id, name, description). n8n renders it
   * as <bases_de_conhecimento>; the model picks one by description and reads
   * it with the `database_information` tool. Empty when the plan has no tool.
   */
  knowledge: KnowledgeIndexItem[];
  /**
   * Recently listed or created active events cached for this profile so
   * follow-ups like "deleta ele" or "altera ele" can resolve eventSeriesId
   * immediately.
   */
  cachedEvents: CachedAssistantEvent[];
  /** ISO-8601 with offset in the profile timezone. */
  now: string;
  /** pt-BR human readable form of `now`. */
  nowHuman: string;
  timezone: string;
}

/** `GET /assistant-m2m/runs/:runId/tools`. */
export interface AssistantRunTools {
  /** Catalogue narrowed to the profile's plan. */
  tools: AssistantTool[];
  /** `tools` rendered for the system prompt ("# Ferramentas disponíveis"). */
  reference: string;
}
