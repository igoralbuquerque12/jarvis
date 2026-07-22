import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventSeriesType } from '@prisma/client';
import { DateTime } from 'luxon';
import { ProfileService } from '../../profile/profile.service';
import { CreateEventDto } from '../dto/create-event.dto';
import { FindActiveEventsDto } from '../dto/find-active-events.dto';
import { getEventsGuideline } from '../utils/get-events-guideline';
import { parseAndNormalizeStartAt } from '../utils/get-next-scheduled-at';
import { EventExecutionService } from './event-execution.service';
import { EventSeriesService } from './event-series.service';

@Injectable()
export class EventsM2mService {
  constructor(
    private readonly eventSeriesService: EventSeriesService,
    private readonly eventExecutionService: EventExecutionService,
    private readonly profileService: ProfileService,
  ) {}

  async createEvent(data: CreateEventDto) {
    const profile = await this.profileService.findOne({ id: data.profileId });
    if (!profile) {
      throw new NotFoundException(`Profile ${data.profileId} not found`);
    }

    this.validateRecurrence(data);

    let scheduledAt: Date;
    try {
      scheduledAt = parseAndNormalizeStartAt(data.startAt, data.timezone);
    } catch {
      throw new BadRequestException('startAt or timezone is invalid.');
    }

    const eventSeries = await this.eventSeriesService.create({
      profileId: data.profileId,
      type: data.type,
      startAt: scheduledAt,
      recurrenceInterval: data.recurrenceInterval,
      recurrenceMode: data.recurrenceMode,
      timezone: data.timezone,
      active: true,
    });
    const eventExecution = await this.eventExecutionService.create({
      eventSeriesId: eventSeries.id,
      scheduledAt,
      content: data.content,
    });

    return { eventSeries, eventExecution };
  }

  async deleteEvent(eventSeriesId: string) {
    await this.eventSeriesService.findOne(eventSeriesId);
    const eventSeries = await this.eventSeriesService.update(eventSeriesId, {
      active: false,
    });
    const cancelledExecutions =
      await this.eventExecutionService.cancelPendingBySeriesId(eventSeriesId);

    return { eventSeries, cancelledExecutions: cancelledExecutions.count };
  }

  async findActiveEvents(filters: FindActiveEventsDto) {
    if (filters.scheduledAt && !filters.timezone) {
      throw new BadRequestException(
        'timezone is required when scheduledAt is provided.',
      );
    }

    let scheduledAtStart: Date | undefined;
    let scheduledAtEnd: Date | undefined;

    if (filters.scheduledAt && filters.timezone) {
      const start = DateTime.fromISO(`${filters.scheduledAt}T00:00:00`, {
        zone: filters.timezone,
      });
      if (!start.isValid) {
        throw new BadRequestException('scheduledAt or timezone is invalid.');
      }
      scheduledAtStart = start.toUTC().toJSDate();
      scheduledAtEnd = start.plus({ days: 1 }).toUTC().toJSDate();
    }

    return this.eventExecutionService.findActive({
      type: filters.type,
      scheduledAtStart,
      scheduledAtEnd,
    });
  }

  getGuideline() {
    return { directive: getEventsGuideline() };
  }

  private validateRecurrence(data: CreateEventDto) {
    const hasRecurrenceFields =
      data.recurrenceInterval !== undefined ||
      data.recurrenceMode !== undefined;

    if (data.type === EventSeriesType.UNIQUE && hasRecurrenceFields) {
      throw new BadRequestException(
        'UNIQUE events cannot contain recurrence fields.',
      );
    }

    if (
      data.type === EventSeriesType.RECURRENCE &&
      (!data.recurrenceInterval || !data.recurrenceMode)
    ) {
      throw new BadRequestException(
        'RECURRENCE events require recurrenceInterval and recurrenceMode.',
      );
    }
  }
}
