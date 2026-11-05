import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventSeriesType, Prisma } from '@prisma/client';
import { DateTime } from 'luxon';
import { RedisService } from '../../redis/services/redis.service';
import { DEFAULT_EVENTS_PAGE_SIZE } from '../constants/event-execution.constant';
import { EVENTS_SCHEDULE_CACHE_KEY } from '../constants/events-cache.constant';
import { CreateMyEventDto } from '../dto/create-my-event.dto';
import { ListMyEventsDto } from '../dto/list-my-events.dto';
import { UpdateMyEventDto } from '../dto/update-my-event.dto';
import {
  EventPageView,
  toEventExecutionView,
} from '../entities/event-execution.view';
import type { EventOwnerProfile } from '../types/event-execution.types';
import { parseAndNormalizeStartAt } from '../utils/get-next-scheduled-at';
import { EventExecutionService } from './event-execution.service';
import { EventSeriesService } from './event-series.service';
import { EventsM2mService } from './events-m2m.service';

/** Web-facing operations over the session profile's own reminders. */
@Injectable()
export class EventsMeService {
  constructor(
    private readonly eventExecutionService: EventExecutionService,
    private readonly eventSeriesService: EventSeriesService,
    private readonly eventsM2mService: EventsM2mService,
    private readonly redisService: RedisService,
  ) {}

  async list(
    profileId: string,
    query: ListMyEventsDto,
  ): Promise<EventPageView> {
    const tab = query.tab ?? 'upcoming';
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_EVENTS_PAGE_SIZE;

    const { items, total, counts } =
      await this.eventExecutionService.findPageByProfile({
        profileId,
        tab,
        q: query.q || undefined,
        type: query.type,
        // The status filter only makes sense for terminal (past) executions.
        status: tab === 'past' ? query.status : undefined,
        page,
        limit,
      });

    return {
      items: items.map(toEventExecutionView),
      total,
      page,
      limit,
      counts,
    };
  }

  async create(profile: EventOwnerProfile, data: CreateMyEventDto) {
    this.assertFuture(data.startAt, profile.timezone);

    const { eventSeries, eventExecution } =
      await this.eventsM2mService.createEvent({
        ...data,
        profileId: profile.id,
      });

    return toEventExecutionView({ ...eventExecution, eventSeries });
  }

  /**
   * Edits a reminder that has not fired yet. For a recurring series, the next
   * occurrences are derived from this execution (content and `scheduledAt`),
   * so changing it carries forward.
   */
  async update(
    profile: EventOwnerProfile,
    executionId: string,
    data: UpdateMyEventDto,
  ) {
    if (data.content === undefined && data.startAt === undefined) {
      throw new BadRequestException('Nothing to update.');
    }

    const execution = await this.eventExecutionService.findOwnedWithSeries(
      profile.id,
      executionId,
    );
    if (!execution) {
      throw new NotFoundException(`Event ${executionId} not found`);
    }
    if (execution.status !== 'PENDING' || !execution.eventSeries.active) {
      throw new ConflictException('Only pending reminders can be edited.');
    }

    const changes: Prisma.EventExecutionUpdateManyMutationInput = {};
    if (data.content !== undefined) {
      changes.content = data.content;
    }

    let scheduledAt: Date | undefined;
    if (data.startAt !== undefined) {
      this.assertFuture(data.startAt, profile.timezone);
      scheduledAt = parseAndNormalizeStartAt(data.startAt, profile.timezone);
      changes.scheduledAt = scheduledAt;
    }

    let updated: Prisma.BatchPayload;
    try {
      updated = await this.eventExecutionService.updatePending(
        executionId,
        changes,
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

    if (scheduledAt && execution.eventSeries.type === EventSeriesType.UNIQUE) {
      await this.eventSeriesService.update(execution.eventSeries.id, {
        startAt: scheduledAt,
      });
    }

    // The scheduler caches { id, scheduledAt } of what is about to fire.
    await this.redisService.getClient().del(EVENTS_SCHEDULE_CACHE_KEY);

    const refreshed = await this.eventExecutionService.findOwnedWithSeries(
      profile.id,
      executionId,
    );
    return toEventExecutionView(refreshed!);
  }

  /** `startAt` without offset is read in the profile timezone. */
  private assertFuture(startAt: string, timezone: string) {
    const parsed = DateTime.fromISO(startAt, { zone: timezone });
    if (!parsed.isValid) {
      throw new BadRequestException('startAt is invalid.');
    }
    if (parsed.toMillis() <= Date.now()) {
      throw new BadRequestException('startAt must be in the future.');
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
