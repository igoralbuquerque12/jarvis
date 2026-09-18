import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventSeriesType } from '@prisma/client';
import { DateTime } from 'luxon';
import { ProfileService } from '../../profile/services/profile.service';
import { RedisService } from '../../redis/services/redis.service';
import {
  EVENTS_SCHEDULE_CACHE_KEY,
  EVENTS_SCHEDULE_CACHE_WINDOW_MS,
} from '../constants/events-cache.constant';
import { CreateEventDto } from '../dto/create-event.dto';
import { FindActiveEventsDto } from '../dto/find-active-events.dto';
import { parseAndNormalizeStartAt } from '../utils/get-next-scheduled-at';
import { EventExecutionService } from './event-execution.service';
import { EventSeriesService } from './event-series.service';

/** ISO-8601 with offset in the profile timezone, ready to be read back to the user. */
function toLocalIso(date: Date, timezone: string): string {
  const dt = DateTime.fromJSDate(date).setZone(timezone);
  return dt.toISO({ suppressMilliseconds: true }) ?? date.toISOString();
}

@Injectable()
export class EventsM2mService {
  constructor(
    private readonly eventSeriesService: EventSeriesService,
    private readonly eventExecutionService: EventExecutionService,
    private readonly profileService: ProfileService,
    private readonly redisService: RedisService,
  ) {}

  async createEvent(data: CreateEventDto) {
    const profile = await this.profileService.findOne({ id: data.profileId });
    if (!profile) {
      throw new NotFoundException(`Profile ${data.profileId} not found`);
    }

    this.validateRecurrence(data);

    let scheduledAt: Date;
    try {
      scheduledAt = parseAndNormalizeStartAt(data.startAt, profile.timezone);
    } catch {
      throw new BadRequestException('startAt is invalid.');
    }

    const eventSeries = await this.eventSeriesService.create({
      profileId: data.profileId,
      type: data.type,
      startAt: scheduledAt,
      recurrenceInterval: data.recurrenceInterval,
      recurrenceMode: data.recurrenceMode,
      active: true,
    });
    const eventExecution = await this.eventExecutionService.create({
      eventSeriesId: eventSeries.id,
      scheduledAt,
      content: data.content,
    });

    if (scheduledAt.getTime() - Date.now() < EVENTS_SCHEDULE_CACHE_WINDOW_MS) {
      await this.redisService.getClient().del(EVENTS_SCHEDULE_CACHE_KEY);
    }

    // scheduledAtLocal is what the assistant must read back to the user:
    // it already reflects the 10-minute rounding and the profile timezone.
    return {
      eventSeries,
      eventExecution,
      scheduledAtLocal: toLocalIso(scheduledAt, profile.timezone),
    };
  }

  /**
   * Deactivates a series and cancels its pending executions.
   * A series that exists but belongs to another profile is reported as not
   * found, so the caller learns nothing about it.
   */
  async deleteEvent(profileId: string, eventSeriesId: string) {
    const series = await this.eventSeriesService.findOne(eventSeriesId);

    if (series.profileId !== profileId) {
      throw new NotFoundException(`Event series ${eventSeriesId} not found`);
    }

    const eventSeries = await this.eventSeriesService.update(eventSeriesId, {
      active: false,
    });
    const cancelledExecutions =
      await this.eventExecutionService.cancelPendingBySeriesId(eventSeriesId);

    return { eventSeries, cancelledExecutions: cancelledExecutions.count };
  }

  async findActiveEvents(filters: FindActiveEventsDto) {
    const profile = await this.profileService.findOne({
      id: filters.profileId,
    });
    if (!profile) {
      throw new NotFoundException(`Profile ${filters.profileId} not found`);
    }

    let scheduledAtStart: Date | undefined;
    let scheduledAtEnd: Date | undefined;

    if (filters.scheduledAt) {
      const start = DateTime.fromISO(`${filters.scheduledAt}T00:00:00`, {
        zone: profile.timezone,
      });
      if (!start.isValid) {
        throw new BadRequestException('scheduledAt is invalid.');
      }
      scheduledAtStart = start.toUTC().toJSDate();
      scheduledAtEnd = start.plus({ days: 1 }).toUTC().toJSDate();
    }

    const executions = await this.eventExecutionService.findActive({
      profileId: filters.profileId,
      type: filters.type,
      scheduledAtStart,
      scheduledAtEnd,
    });

    return executions.map((execution) => ({
      ...execution,
      scheduledAtLocal: toLocalIso(execution.scheduledAt, profile.timezone),
    }));
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
