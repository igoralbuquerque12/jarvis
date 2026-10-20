import { Injectable } from '@nestjs/common';
import { ASSISTANT_TOOLS } from '../tools/main.tools';
import type { AssistantTool } from '../tools/tool.types';
import { buildDirective } from '../utils/build-system-prompt';
import { filterToolsByPlan } from '../utils/filter-tools-by-plan';

export interface AssistantToolset {
  tools: AssistantTool[];
  /** Static instructions + catalogue of `tools`, rendered once per plan. */
  directive: string;
}

/** Catalogue sent to n8n, narrowed to what the caller's plan unlocks. */
@Injectable()
export class AssistantToolsService {
  private readonly cache = new Map<number, AssistantToolset>();

  forPlan(plan: number): AssistantToolset {
    const cached = this.cache.get(plan);

    if (cached) {
      return cached;
    }

    const tools = filterToolsByPlan(ASSISTANT_TOOLS, plan);
    const toolset = { tools, directive: buildDirective(tools) };
    this.cache.set(plan, toolset);

    return toolset;
  }
}
