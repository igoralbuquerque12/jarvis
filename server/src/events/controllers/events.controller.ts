import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { BetterAuthService } from '../../auth/services/better-auth.service';
import { ProfileService } from '../../profile/services/profile.service';
import { CreateMyEventDto } from '../dto/create-my-event.dto';
import { ListMyEventsDto } from '../dto/list-my-events.dto';
import { UpdateMyEventDto } from '../dto/update-my-event.dto';
import { toEventExecutionView } from '../entities/event-execution.view';
import { EventExecutionService } from '../services/event-execution.service';
import { EventsM2mService } from '../services/events-m2m.service';
import { EventsMeService } from '../services/events-me.service';
import { PLAN_FEATURE_MIN_PLAN } from '../../subscription/constants/subscription-plans.constant';
import { RequiresPlan } from '../../subscription/decorators/requires-plan.decorator';

@RequiresPlan(PLAN_FEATURE_MIN_PLAN.eventsManagement)
@Controller('events')
export class EventsController {
  constructor(
    private readonly authService: BetterAuthService,
    private readonly profileService: ProfileService,
    private readonly eventExecutionService: EventExecutionService,
    private readonly eventsM2mService: EventsM2mService,
    private readonly eventsMeService: EventsMeService,
  ) {}

  @Get('me')
  async findMyUpcomingEvents(@Req() request: Request) {
    const profile = await this.requireProfile(request);
    const executions = await this.eventExecutionService.findActive({
      profileId: profile.id,
    });

    return executions.map(toEventExecutionView);
  }

  @Get('me/list')
  async listMine(@Req() request: Request, @Query() query: ListMyEventsDto) {
    const profile = await this.requireProfile(request);

    return this.eventsMeService.list(profile.id, query);
  }

  @Post('me')
  async createMine(@Req() request: Request, @Body() data: CreateMyEventDto) {
    const profile = await this.requireProfile(request);

    return this.eventsMeService.create(profile, data);
  }

  @Patch('me/:executionId')
  async updateMine(
    @Req() request: Request,
    @Param('executionId', ParseUUIDPipe) executionId: string,
    @Body() data: UpdateMyEventDto,
  ) {
    const profile = await this.requireProfile(request);

    return this.eventsMeService.update(profile, executionId, data);
  }

  @Delete('me/series/:seriesId')
  async cancelMySeries(
    @Req() request: Request,
    @Param('seriesId', ParseUUIDPipe) seriesId: string,
  ) {
    const profile = await this.requireProfile(request);
    // Ownership is enforced inside deleteEvent (404 for foreign series).
    const result = await this.eventsM2mService.deleteEvent(
      profile.id,
      seriesId,
    );

    return { cancelledExecutions: result.cancelledExecutions };
  }

  private async requireProfile(request: Request) {
    const session = await this.authService.requireSession(request.headers);

    return this.profileService.ensureAuthProfile(session.user);
  }
}
