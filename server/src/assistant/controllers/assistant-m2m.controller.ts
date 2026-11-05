import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { M2mExceptionFilter } from '../../core/filters/m2m-exception.filter';
import { ExecuteToolDto } from '../dto/execute-tool.dto';
import { AssistantToolGuard } from '../guards/assistant-tool.guard';
import { AssistantContextService } from '../services/assistant-context.service';
import { AssistantToolDispatcherService } from '../services/assistant-tool-dispatcher.service';

/**
 * What n8n calls back for a run: the context, the tools of the user's plan,
 * and the single tool-execution endpoint. Private network only.
 */
@UseGuards(AssistantToolGuard)
@UseFilters(M2mExceptionFilter)
@Controller('assistant-m2m/runs')
export class AssistantM2mController {
  constructor(
    private readonly assistantContextService: AssistantContextService,
    private readonly assistantToolDispatcherService: AssistantToolDispatcherService,
  ) {}

  @Get(':runId/context')
  getContext(@Param('runId', ParseUUIDPipe) runId: string) {
    return this.assistantContextService.getContext(runId);
  }

  @Get(':runId/tools')
  getTools(@Param('runId', ParseUUIDPipe) runId: string) {
    return this.assistantContextService.getTools(runId);
  }

  @Post(':runId/tools/execute')
  execute(
    @Param('runId', ParseUUIDPipe) runId: string,
    @Body() body: ExecuteToolDto,
  ) {
    return this.assistantToolDispatcherService.execute(runId, body);
  }
}
