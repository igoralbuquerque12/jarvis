import { Injectable, NotFoundException } from '@nestjs/common';
import { EventExecutionStatus, EventSeriesType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type ActiveExecutionFilters = {
  type?: EventSeriesType;
  scheduledAtStart?: Date;
  scheduledAtEnd?: Date;
};

@Injectable()
export class EventExecutionService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.EventExecutionUncheckedCreateInput) {
    return this.prisma.eventExecution.create({ data });
  }

  findAll() {
    return this.prisma.eventExecution.findMany();
  }

  async findOne(id: string) {
    const eventExecution = await this.prisma.eventExecution.findUnique({
      where: { id },
    });

    if (!eventExecution) {
      throw new NotFoundException(`Event execution ${id} not found`);
    }

    return eventExecution;
  }

  update(id: string, data: Prisma.EventExecutionUpdateInput) {
    return this.prisma.eventExecution.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.eventExecution.delete({ where: { id } });
  }

  findPendingDue(now: Date) {
    return this.prisma.eventExecution.findMany({
      where: {
        status: EventExecutionStatus.PENDING,
        scheduledAt: { lte: now },
        eventSeries: { active: true },
      },
      include: {
        eventSeries: {
          include: { profile: true },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  markAsProcessing(ids: string[]) {
    if (ids.length === 0) {
      return Promise.resolve({ count: 0 });
    }

    return this.prisma.eventExecution.updateMany({
      where: {
        id: { in: ids },
        status: EventExecutionStatus.PENDING,
        eventSeries: { active: true },
      },
      data: { status: EventExecutionStatus.PROCESSING },
    });
  }

  cancelPendingBySeriesId(eventSeriesId: string) {
    return this.prisma.eventExecution.updateMany({
      where: {
        eventSeriesId,
        status: EventExecutionStatus.PENDING,
      },
      data: { status: EventExecutionStatus.CANCELLED },
    });
  }

  findActive(filters: ActiveExecutionFilters) {
    return this.prisma.eventExecution.findMany({
      where: {
        status: {
          in: [EventExecutionStatus.PENDING, EventExecutionStatus.PROCESSING],
        },
        ...(filters.scheduledAtStart && filters.scheduledAtEnd
          ? {
              scheduledAt: {
                gte: filters.scheduledAtStart,
                lt: filters.scheduledAtEnd,
              },
            }
          : {}),
        eventSeries: {
          active: true,
          ...(filters.type ? { type: filters.type } : {}),
        },
      },
      include: {
        eventSeries: {
          select: {
            id: true,
            profileId: true,
            type: true,
            startAt: true,
            recurrenceInterval: true,
            recurrenceMode: true,
            timezone: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }
}
