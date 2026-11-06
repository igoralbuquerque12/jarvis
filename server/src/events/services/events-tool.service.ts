import { Injectable } from '@nestjs/common';

import {
  AssistantToolHandler,
  AssistantToolHandlerFor,
} from '../../assistant/tools/tool-handler';
import { unsupportedOperation } from '../../core/errors/m2m.errors';
import { requireUuid } from '../../core/utils/require-uuid.util';
import { validateDto } from '../../core/utils/validate-dto.util';
import { CreateEventDto } from '../dto/create-event.dto';
import { FindActiveEventsDto } from '../dto/find-active-events.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { EventsM2mService } from './events-m2m.service';

/** Handler of the `events` assistant tool. */
@Injectable()
@AssistantToolHandlerFor('events')
export class EventsToolService implements AssistantToolHandler {
  constructor(private readonly eventsM2mService: EventsM2mService) {}

  async execute(
    profileId: string,
    operation: string,
    data: Record<string, unknown>,
  ) {
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
      case 'update_event': {
        const dto = await validateDto(UpdateEventDto, { ...data, profileId });
        return this.eventsM2mService.updateEvent(dto);
      }
      case 'delete_event':
        return this.eventsM2mService.deleteEvent(
          profileId,
          requireUuid(data, 'eventSeriesId'),
        );
      default:
        throw unsupportedOperation(operation);
    }
  }
}
