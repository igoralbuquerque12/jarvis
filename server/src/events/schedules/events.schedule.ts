import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventExecutionStatus, EventSeriesType, Prisma } from '@prisma/client';
import { RedisService } from '../../redis/services/redis.service';
import { WhatsappSenderService } from '../../whatsapp/services/whatsapp-sender.service';
import {
  EVENTS_SCHEDULE_CACHE_KEY,
  EVENTS_SCHEDULE_CACHE_TTL_SECONDS,
  EVENTS_SCHEDULE_CACHE_WINDOW_MS,
} from '../constants/events-cache.constant';
import { EventExecutionService } from '../services/event-execution.service';
import { EventSeriesService } from '../services/event-series.service';
import { getNextScheduledAt } from '../utils/get-next-scheduled-at';

type CachedEvent = { id: string; scheduledAt: string };

@Injectable()
export class EventsSchedule {
  private readonly logger = new Logger(EventsSchedule.name);

  constructor(
    private readonly eventExecutionService: EventExecutionService,
    private readonly eventSeriesService: EventSeriesService,
    private readonly whatsappSenderService: WhatsappSenderService,
    private readonly redisService: RedisService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async processDueEvents() {
    const now = new Date();
    const cached = await this.getOrPopulateCache(now);

    const due = cached.filter((event) => new Date(event.scheduledAt) <= now);
    if (due.length === 0) {
      return;
    }

    const pending = cached.filter((event) => new Date(event.scheduledAt) > now);
    await this.redisService
      .getClient()
      .set(EVENTS_SCHEDULE_CACHE_KEY, JSON.stringify(pending), {
        expiration: 'KEEPTTL',
      });

    const executions =
      await this.eventExecutionService.findManyByIdsForProcessing(
        due.map((event) => event.id),
      );
    const marked = await this.eventExecutionService.markAsProcessing(
      executions.map((execution) => execution.id),
    );

    if (marked.count === 0) {
      return;
    }

    for (const execution of executions) {
      await this.processExecution(execution);
    }
  }

  private async getOrPopulateCache(now: Date): Promise<CachedEvent[]> {
    const client = this.redisService.getClient();
    const raw = await client.get(EVENTS_SCHEDULE_CACHE_KEY);

    if (raw !== null) {
      return JSON.parse(raw) as CachedEvent[];
    }

    const windowEnd = new Date(now.getTime() + EVENTS_SCHEDULE_CACHE_WINDOW_MS);
    const executions =
      await this.eventExecutionService.findPendingIdsInWindow(windowEnd);
    const cached: CachedEvent[] = executions.map((execution) => ({
      id: execution.id,
      scheduledAt: execution.scheduledAt.toISOString(),
    }));

    await client.set(EVENTS_SCHEDULE_CACHE_KEY, JSON.stringify(cached), {
      expiration: { type: 'EX', value: EVENTS_SCHEDULE_CACHE_TTL_SECONDS },
    });

    return cached;
  }

  private async processExecution(
    execution: Prisma.EventExecutionGetPayload<{
      include: { eventSeries: { include: { profile: true } } };
    }>,
  ) {
    try {
      await this.whatsappSenderService.sendMessage(
        execution.eventSeries.profile.jid,
        execution.content,
      );
      await this.eventExecutionService.update(execution.id, {
        status: EventExecutionStatus.COMPLETED,
      });
    } catch (error) {
      const observabilitys =
        error instanceof Error
          ? error.message
          : 'Unknown error while sending event.';
      this.logger.error(
        `Event execution ${execution.id} failed: ${observabilitys}`,
      );
      await this.eventExecutionService.update(execution.id, {
        status: EventExecutionStatus.FAILED,
        observabilitys,
      });
    }

    await this.createNextExecution(execution);
  }

  private async createNextExecution(
    execution: Prisma.EventExecutionGetPayload<{
      include: { eventSeries: { include: { profile: true } } };
    }>,
  ) {
    const eventSeries = await this.eventSeriesService.findOne(
      execution.eventSeriesId,
    );

    if (!eventSeries.active) {
      return;
    }

    if (eventSeries.type === EventSeriesType.UNIQUE) {
      await this.eventSeriesService.update(eventSeries.id, { active: false });
      return;
    }

    const scheduledAt = getNextScheduledAt(
      execution.scheduledAt,
      eventSeries.recurrenceMode!,
      eventSeries.recurrenceInterval!,
      execution.eventSeries.profile.timezone,
    );

    try {
      await this.eventExecutionService.create({
        eventSeriesId: eventSeries.id,
        scheduledAt,
        content: execution.content,
      });
    } catch (error) {
      if (this.isDuplicateExecution(error)) {
        return;
      }
      throw error;
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
