import {
  BadRequestException,
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AssistantToolGuard } from '../../assistant/guards/assistant-tool.guard';
import { ExecuteOperationDto } from '../../core/dto/execute-operation.dto';

import { EventsM2mService } from '../services/events-m2m.service';

import { CreateEventDto } from '../dto/create-event.dto';
import { FindActiveEventsDto } from '../dto/find-active-events.dto';

import { validateDto } from '../../core/utils/validate-dto.util';

@UseGuards(AssistantToolGuard)
@Controller('events-m2m')
export class EventsM2mController {
  constructor(private readonly eventsM2mService: EventsM2mService) {}

  @Post(':profileId/execute')
  async execute(
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() body: ExecuteOperationDto,
  ) {
    const { operation, data = {} } = body;

    const dataWithProfile = { ...data, profileId };

    switch (operation) {
      case 'create_event': {
        const dto = await validateDto(CreateEventDto, dataWithProfile);
        return this.eventsM2mService.createEvent(dto);
      }
      case 'delete_event': {
        return this.eventsM2mService.deleteEvent(data.eventSeriesId as string);
      }
      case 'find_active_events': {
        const dto = await validateDto(FindActiveEventsDto, dataWithProfile);
        return this.eventsM2mService.findActiveEvents(dto);
      }
      case 'get_guideline': {
        return this.eventsM2mService.getGuideline();
      }
      default:
        throw new BadRequestException('Operação não suportada');
    }
  }
}
