import type { AssistantTool } from './tool.types';
import { EVENTS_TOOL } from './events.tools';
import { FINANCE_TOOLS } from './finance.tools';
import { DATABASE_INFORMATION_TOOL } from './database-information.tools';

export const ASSISTANT_TOOLS: AssistantTool[] = [
  EVENTS_TOOL,
  ...FINANCE_TOOLS,
  DATABASE_INFORMATION_TOOL,
];
