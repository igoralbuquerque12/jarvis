import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventExecutionStatus, EventSeriesType, Prisma } from '@prisma/client';
import { WhatsappSenderService } from '../../whatsapp/whatsapp-sender.service';
import { EventExecutionService } from '../services/event-execution.service';
import { EventSeriesService } from '../services/event-series.service';
import { getNextScheduledAt } from '../utils/get-next-scheduled-at';

@Injectable()
export class EventsSchedule {
  private readonly logger = new Logger(EventsSchedule.name);

  constructor(
    private readonly eventExecutionService: EventExecutionService,
    private readonly eventSeriesService: EventSeriesService,
    private readonly whatsappSenderService: WhatsappSenderService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async processDueEvents() {
    const executions = await this.eventExecutionService.findPendingDue(
      new Date(),
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
      eventSeries.timezone,
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
