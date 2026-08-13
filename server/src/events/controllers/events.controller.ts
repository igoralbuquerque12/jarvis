import {
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { BetterAuthService } from '../../auth/better-auth.service';
import { ProfileService } from '../../profile/profile.service';
import { EventExecutionService } from '../services/event-execution.service';
import { EventSeriesService } from '../services/event-series.service';
import { EventsM2mService } from '../services/events-m2m.service';

@Controller('events')
export class EventsController {
  constructor(
    private readonly authService: BetterAuthService,
    private readonly profileService: ProfileService,
    private readonly eventSeriesService: EventSeriesService,
    private readonly eventExecutionService: EventExecutionService,
    private readonly eventsM2mService: EventsM2mService,
  ) {}

  @Get('me')
  async findMyUpcomingEvents(@Req() request: Request) {
    const profile = await this.requireProfile(request);
    const executions = await this.eventExecutionService.findActive({
      profileId: profile.id,
    });

    return executions.map((execution) => ({
      id: execution.id,
      content: execution.content,
      scheduledAt: execution.scheduledAt,
      status: execution.status,
      series: {
        id: execution.eventSeries.id,
        type: execution.eventSeries.type,
        recurrenceInterval: execution.eventSeries.recurrenceInterval,
        recurrenceMode: execution.eventSeries.recurrenceMode,
      },
    }));
  }

  @Delete('me/series/:seriesId')
  async cancelMySeries(
    @Req() request: Request,
    @Param('seriesId', ParseUUIDPipe) seriesId: string,
  ) {
    const profile = await this.requireProfile(request);
    const series = await this.eventSeriesService.findOne(seriesId);

    if (series.profileId !== profile.id) {
      throw new NotFoundException(`Event series ${seriesId} not found`);
    }

    const result = await this.eventsM2mService.deleteEvent(seriesId);

    return { cancelledExecutions: result.cancelledExecutions };
  }

  private async requireProfile(request: Request) {
    const session = await this.authService.requireSession(request.headers);

    return this.profileService.ensureAuthProfile(session.user);
  }
}
