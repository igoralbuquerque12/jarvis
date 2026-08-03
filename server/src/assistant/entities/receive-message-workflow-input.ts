import type { Message } from '@prisma/client';
import type { AssistantTool } from '../tools/events.tools';

export class ReceiveMessageWorkflowInput {
  directive: string;
  profileId: string;
  profileContext: string;
  currentMessage?: string;
  lastMessages: Message[];
  tools: AssistantTool[];
}
