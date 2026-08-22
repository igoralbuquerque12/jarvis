import { AssistantTool, EVENTS_TOOL } from './events.tools';
import { FINANCE_TOOLS } from './finance.tools';

export const ASSISTANT_TOOLS: AssistantTool[] = [EVENTS_TOOL, ...FINANCE_TOOLS];
