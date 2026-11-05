import { Injectable } from '@nestjs/common';

import {
  unsupportedOperation,
  unsupportedTool,
} from '../../core/errors/m2m.errors';
import { AssistantRunService } from './assistant-run.service';
import { AssistantToolRegistry } from './assistant-tool-registry.service';
import { AssistantToolsService } from './assistant-tools.service';

export interface ToolCall {
  tool: string;
  operation: string;
  data?: Record<string, unknown>;
}

/**
 * Single entry point of every assistant tool call. The profile comes from
 * the run (never from the model) and the plan is enforced here too, not only
 * by narrowing the catalogue n8n receives.
 */
@Injectable()
export class AssistantToolDispatcherService {
  constructor(
    private readonly assistantRunService: AssistantRunService,
    private readonly assistantToolsService: AssistantToolsService,
    private readonly assistantToolRegistry: AssistantToolRegistry,
  ) {}

  async execute(runId: string, { tool, operation, data = {} }: ToolCall) {
    const { profile } = await this.assistantRunService.findActive(runId);
    const { tools } = await this.assistantToolsService.forProfile(profile);

    const descriptor = tools.find((item) => item.name === tool);
    if (!descriptor) {
      throw unsupportedTool(tool);
    }

    if (!descriptor.operations.some((item) => item.name === operation)) {
      throw unsupportedOperation(operation);
    }

    return this.assistantToolRegistry
      .get(tool)
      .execute(profile.id, operation, data);
  }
}
