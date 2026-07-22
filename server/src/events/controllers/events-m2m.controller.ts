import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CreateEventDto } from '../dto/create-event.dto';
import { FindActiveEventsDto } from '../dto/find-active-events.dto';
import { EventsM2mService } from '../services/events-m2m.service';

@Controller('events-m2m')
export class EventsM2mController {
  constructor(private readonly eventsM2mService: EventsM2mService) {}

  @Post('events')
  createEvent(@Body() data: CreateEventDto) {
    return this.eventsM2mService.createEvent(data);
  }

  @Delete('events/:eventSeriesId')
  deleteEvent(@Param('eventSeriesId') eventSeriesId: string) {
    return this.eventsM2mService.deleteEvent(eventSeriesId);
  }

  @Get('events')
  findActiveEvents(@Query() filters: FindActiveEventsDto) {
    return this.eventsM2mService.findActiveEvents(filters);
  }

  @Get('guideline')
  getGuideline() {
    return this.eventsM2mService.getGuideline();
  }
}
