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
import { SendRunMessageDto } from '../dto/send-run-message.dto';
import { AssistantToolGuard } from '../guards/assistant-tool.guard';
import { AssistantContextService } from '../services/assistant-context.service';
import { AssistantMessageService } from '../services/assistant-message.service';
import { AssistantToolDispatcherService } from '../services/assistant-tool-dispatcher.service';

/**
 * What n8n calls back for a run: the context, the tools of the user's plan,
 * the single tool-execution endpoint and the message endpoint (the only way
 * the assistant talks to the user). Private network only.
 */
@UseGuards(AssistantToolGuard)
@UseFilters(M2mExceptionFilter)
@Controller('assistant-m2m/runs')
export class AssistantM2mController {
  constructor(
    private readonly assistantContextService: AssistantContextService,
    private readonly assistantToolDispatcherService: AssistantToolDispatcherService,
    private readonly assistantMessageService: AssistantMessageService,
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

  /** Backend side of the n8n `enviar_mensagem` tool (every plan has it). */
  @Post(':runId/messages')
  sendMessage(
    @Param('runId', ParseUUIDPipe) runId: string,
    @Body() body: SendRunMessageDto,
  ) {
    return this.assistantMessageService.sendForRun(runId, body.content);
  }
}
