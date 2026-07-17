import type { Message } from '@prisma/client';

export class ReceiveMessageWorkflowInput {
  directive: string;
  profileId: string;
  profileContext: string;
  currentMessage?: string;
  lastMessages: Message[];
}
