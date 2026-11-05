import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { AssistantToolGuard } from '../../assistant/guards/assistant-tool.guard';
import { ExecuteOperationDto } from '../../core/dto/execute-operation.dto';
import { unsupportedOperation } from '../../core/errors/m2m.errors';
import { M2mExceptionFilter } from '../../core/filters/m2m-exception.filter';
import { requireUuid } from '../../core/utils/require-uuid.util';
import { DatabaseInformationService } from '../services/database-information.service';

/**
 * Knowledge queries for the assistant. `knowledge-m2m` is the general prefix;
 * each source gets its own path (`database-information` today, audit later).
 */
@UseGuards(AssistantToolGuard)
@UseFilters(M2mExceptionFilter)
@Controller('knowledge-m2m')
export class DatabaseInformationM2mController {
  constructor(
    private readonly databaseInformationService: DatabaseInformationService,
  ) {}

  @Post(':profileId/database-information/execute')
  async execute(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() body: ExecuteOperationDto,
  ) {
    const { operation, data = {} } = body;

    switch (operation) {
      case 'get_database_information':
        return this.databaseInformationService.findOneForAssistant(
          profileId,
          requireUuid(data, 'databaseInformationId'),
        );
      default:
        throw unsupportedOperation(operation);
    }
  }
}
