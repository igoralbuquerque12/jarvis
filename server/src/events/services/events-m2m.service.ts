import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventSeriesType, Prisma } from '@prisma/client';
import { DateTime } from 'luxon';
import { ProfileService } from '../../profile/services/profile.service';
import { RedisService } from '../../redis/services/redis.service';
import {
  EVENTS_ASSISTANT_CACHE_TTL_SECONDS,
  EVENTS_SCHEDULE_CACHE_KEY,
  EVENTS_SCHEDULE_CACHE_WINDOW_MS,
  getEventsAssistantCacheKey,
} from '../constants/events-cache.constant';
import { CreateEventDto } from '../dto/create-event.dto';
import { FindActiveEventsDto } from '../dto/find-active-events.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import type { CachedAssistantEvent } from '../types/event-execution.types';
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

    const scheduledAtLocal = toLocalIso(scheduledAt, profile.timezone);

    await this.upsertCachedEvent(data.profileId, {
      id: eventExecution.id,
      eventSeriesId: eventSeries.id,
      content: eventExecution.content ?? data.content,
      scheduledAtLocal,
      type: eventSeries.type ?? data.type,
      recurrenceInterval:
        eventSeries.recurrenceInterval ?? data.recurrenceInterval ?? null,
      recurrenceMode: eventSeries.recurrenceMode ?? data.recurrenceMode ?? null,
    });

    return {
      eventSeries,
      eventExecution,
      scheduledAtLocal,
    };
  }

  async updateEvent(data: UpdateEventDto) {
    const hasChanges =
      data.content !== undefined ||
      data.startAt !== undefined ||
      data.type !== undefined ||
      data.recurrenceInterval !== undefined ||
      data.recurrenceMode !== undefined;

    if (!hasChanges) {
      throw new BadRequestException('Nothing to update.');
    }

    const profile = await this.profileService.findOne({ id: data.profileId });
    if (!profile) {
      throw new NotFoundException(`Profile ${data.profileId} not found`);
    }

    const execution =
      await this.eventExecutionService.findPendingBySeriesOrExecutionId(
        data.profileId,
        data.eventSeriesId,
      );

    if (!execution) {
      throw new NotFoundException(`Event ${data.eventSeriesId} not found`);
    }

    if (execution.status !== 'PENDING' || !execution.eventSeries.active) {
      throw new ConflictException('Only pending reminders can be edited.');
    }

    const nextType = data.type ?? execution.eventSeries.type;
    const hasRecurrenceFieldsInData =
      data.recurrenceInterval !== undefined ||
      data.recurrenceMode !== undefined;

    if (data.type === EventSeriesType.UNIQUE && hasRecurrenceFieldsInData) {
      throw new BadRequestException(
        'UNIQUE events cannot contain recurrence fields.',
      );
    }

    const nextInterval =
      nextType === EventSeriesType.UNIQUE
        ? null
        : (data.recurrenceInterval ?? execution.eventSeries.recurrenceInterval);
    const nextMode =
      nextType === EventSeriesType.UNIQUE
        ? null
        : (data.recurrenceMode ?? execution.eventSeries.recurrenceMode);

    if (
      nextType === EventSeriesType.RECURRENCE &&
      (!nextInterval || !nextMode)
    ) {
      throw new BadRequestException(
        'RECURRENCE events require recurrenceInterval and recurrenceMode.',
      );
    }

    let scheduledAt: Date | undefined;
    if (data.startAt !== undefined) {
      try {
        scheduledAt = parseAndNormalizeStartAt(data.startAt, profile.timezone);
      } catch {
        throw new BadRequestException('startAt is invalid.');
      }
    }

    const executionChanges: Prisma.EventExecutionUpdateManyMutationInput = {};
    if (data.content !== undefined) {
      executionChanges.content = data.content;
    }
    if (scheduledAt !== undefined) {
      executionChanges.scheduledAt = scheduledAt;
    }

    if (Object.keys(executionChanges).length > 0) {
      let updated: Prisma.BatchPayload;
      try {
        updated = await this.eventExecutionService.updatePending(
          execution.id,
          executionChanges,
        );
      } catch (error) {
        if (this.isDuplicateExecution(error)) {
          throw new ConflictException(
            'This series already has a reminder at that time.',
          );
        }
        throw error;
      }

      if (updated.count === 0) {
        throw new ConflictException('Only pending reminders can be edited.');
      }
    }

    const seriesChanges: Prisma.EventSeriesUpdateInput = {};
    if (nextType !== execution.eventSeries.type) {
      seriesChanges.type = nextType;
    }
    if (nextInterval !== execution.eventSeries.recurrenceInterval) {
      seriesChanges.recurrenceInterval = nextInterval;
    }
    if (nextMode !== execution.eventSeries.recurrenceMode) {
      seriesChanges.recurrenceMode = nextMode;
    }
    if (scheduledAt && nextType === EventSeriesType.UNIQUE) {
      seriesChanges.startAt = scheduledAt;
    }

    const updatedSeries =
      Object.keys(seriesChanges).length > 0
        ? await this.eventSeriesService.update(
            execution.eventSeries.id,
            seriesChanges,
          )
        : execution.eventSeries;

    const finalScheduledAt = scheduledAt ?? execution.scheduledAt;
    const finalContent = data.content ?? execution.content;
    const scheduledAtLocal = toLocalIso(finalScheduledAt, profile.timezone);

    await this.redisService.getClient().del(EVENTS_SCHEDULE_CACHE_KEY);

    await this.upsertCachedEvent(data.profileId, {
      id: execution.id,
      eventSeriesId: execution.eventSeries.id,
      content: finalContent,
      scheduledAtLocal,
      type: nextType,
      recurrenceInterval: nextInterval,
      recurrenceMode: nextMode,
    });

    return {
      eventSeries: updatedSeries,
      eventExecution: {
        ...execution,
        content: finalContent,
        scheduledAt: finalScheduledAt,
        eventSeries: updatedSeries,
      },
      scheduledAtLocal,
    };
  }

  /**
   * Deactivates a series and cancels its pending executions.
   * A series that exists but belongs to another profile is reported as not
   * found, so the caller learns nothing about it. Also accepts an execution id
   * belonging to the profile and resolves its series automatically.
   */
  async deleteEvent(profileId: string, eventSeriesId: string) {
    let targetSeriesId = eventSeriesId;
    let series: Awaited<ReturnType<EventSeriesService['findOne']>>;

    try {
      series = await this.eventSeriesService.findOne(targetSeriesId);
    } catch (error) {
      if (
        error instanceof NotFoundException &&
        typeof this.eventExecutionService.findOwnedWithSeries === 'function'
      ) {
        const ownedExecution =
          await this.eventExecutionService.findOwnedWithSeries(
            profileId,
            eventSeriesId,
          );
        if (!ownedExecution) {
          throw error;
        }
        targetSeriesId = ownedExecution.eventSeries.id;
        series = await this.eventSeriesService.findOne(targetSeriesId);
      } else {
        throw error;
      }
    }

    if (series.profileId !== profileId) {
      throw new NotFoundException(`Event series ${eventSeriesId} not found`);
    }

    const eventSeries = await this.eventSeriesService.update(targetSeriesId, {
      active: false,
    });
    const cancelledExecutions =
      await this.eventExecutionService.cancelPendingBySeriesId(targetSeriesId);

    await this.removeCachedEvent(profileId, targetSeriesId);

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
    } else if (
      filters.filter === 'TODAY' ||
      filters.filter === 'NEXT_3_DAYS' ||
      filters.filter === 'NEXT_7_DAYS' ||
      filters.filter === 'NEXT_30_DAYS'
    ) {
      const todayStart = DateTime.now()
        .setZone(profile.timezone)
        .startOf('day');
      const days =
        filters.filter === 'TODAY'
          ? 1
          : filters.filter === 'NEXT_3_DAYS'
            ? 3
            : filters.filter === 'NEXT_7_DAYS'
              ? 7
              : 30;
      scheduledAtStart = todayStart.toUTC().toJSDate();
      scheduledAtEnd = todayStart.plus({ days }).toUTC().toJSDate();
    }

    const effectiveType =
      filters.type ??
      (filters.filter === 'RECURRING' ? EventSeriesType.RECURRENCE : undefined);

    const executions = await this.eventExecutionService.findActive({
      profileId: filters.profileId,
      type: effectiveType,
      scheduledAtStart,
      scheduledAtEnd,
    });

    const mapped = executions.map((execution) => ({
      ...execution,
      scheduledAtLocal: toLocalIso(execution.scheduledAt, profile.timezone),
    }));

    await this.setCachedEvents(
      filters.profileId,
      mapped.map((item) => ({
        id: item.id,
        eventSeriesId: item.eventSeries.id,
        content: item.content,
        scheduledAtLocal: item.scheduledAtLocal,
        type: item.eventSeries.type,
        recurrenceInterval: item.eventSeries.recurrenceInterval ?? null,
        recurrenceMode: item.eventSeries.recurrenceMode ?? null,
      })),
    );

    return mapped;
  }

  async getCachedEvents(profileId: string): Promise<CachedAssistantEvent[]> {
    const client = this.redisService.getClient();
    if (typeof client?.get !== 'function') {
      return [];
    }

    const raw = await client.get(getEventsAssistantCacheKey(profileId));
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as CachedAssistantEvent[]) : [];
    } catch {
      return [];
    }
  }

  private async setCachedEvents(
    profileId: string,
    events: CachedAssistantEvent[],
  ): Promise<void> {
    const client = this.redisService.getClient();
    if (typeof client?.set !== 'function') {
      return;
    }

    await client.set(
      getEventsAssistantCacheKey(profileId),
      JSON.stringify(events),
      {
        expiration: { type: 'EX', value: EVENTS_ASSISTANT_CACHE_TTL_SECONDS },
      },
    );
  }

  private async upsertCachedEvent(
    profileId: string,
    event: CachedAssistantEvent,
  ): Promise<void> {
    const current = await this.getCachedEvents(profileId);
    const filtered = current.filter(
      (item) =>
        item.eventSeriesId !== event.eventSeriesId && item.id !== event.id,
    );
    await this.setCachedEvents(profileId, [event, ...filtered]);
  }

  private async removeCachedEvent(
    profileId: string,
    eventSeriesId: string,
  ): Promise<void> {
    const current = await this.getCachedEvents(profileId);
    if (current.length === 0) {
      return;
    }

    const remaining = current.filter(
      (item) => item.eventSeriesId !== eventSeriesId,
    );

    if (remaining.length === 0) {
      const client = this.redisService.getClient();
      if (typeof client?.del === 'function') {
        await client.del(getEventsAssistantCacheKey(profileId));
      }
      return;
    }

    await this.setCachedEvents(profileId, remaining);
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

  private isDuplicateExecution(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}
