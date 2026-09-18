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
import { validateDto } from '../../core/utils/validate-dto.util';
import { CreateEventDto } from '../dto/create-event.dto';
import { FindActiveEventsDto } from '../dto/find-active-events.dto';
import { EventsM2mService } from '../services/events-m2m.service';

@UseGuards(AssistantToolGuard)
@UseFilters(M2mExceptionFilter)
@Controller('events-m2m')
export class EventsM2mController {
  constructor(private readonly eventsM2mService: EventsM2mService) {}

  @Post(':profileId/execute')
  async execute(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() body: ExecuteOperationDto,
  ) {
    const { operation, data = {} } = body;

    switch (operation) {
      case 'create_event': {
        const dto = await validateDto(CreateEventDto, { ...data, profileId });
        return this.eventsM2mService.createEvent(dto);
      }
      case 'find_active_events': {
        const dto = await validateDto(FindActiveEventsDto, {
          ...data,
          profileId,
        });
        return this.eventsM2mService.findActiveEvents(dto);
      }
      case 'delete_event': {
        // The series must belong to the profile in the route; the id alone
        // is never enough (the model could hallucinate someone else's id).
        return this.eventsM2mService.deleteEvent(
          profileId,
          requireUuid(data, 'eventSeriesId'),
        );
      }
      default:
        throw unsupportedOperation(operation);
    }
  }
}
