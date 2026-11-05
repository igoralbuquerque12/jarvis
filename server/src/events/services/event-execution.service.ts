import { Injectable, NotFoundException } from '@nestjs/common';
import { EventExecutionStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/services/prisma.service';
import {
  EVENT_SERIES_SUMMARY_SELECT,
  PAST_EVENT_STATUSES,
  UPCOMING_EVENT_STATUSES,
} from '../constants/event-execution.constant';
import type {
  ActiveExecutionFilters,
  EventPageFilters,
} from '../types/event-execution.types';

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

  findPendingIdsInWindow(windowEnd: Date) {
    return this.prisma.eventExecution.findMany({
      where: {
        status: EventExecutionStatus.PENDING,
        scheduledAt: { lte: windowEnd },
        eventSeries: { active: true },
      },
      select: { id: true, scheduledAt: true },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  findManyByIdsForProcessing(ids: string[]): Promise<
    Prisma.EventExecutionGetPayload<{
      include: { eventSeries: { include: { profile: true } } };
    }>[]
  > {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }

    return this.prisma.eventExecution.findMany({
      where: {
        id: { in: ids },
        status: EventExecutionStatus.PENDING,
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
          profileId: filters.profileId,
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
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  /**
   * One page of the profile's executions for the web list, plus the size of
   * both tabs (which ignore the `status` filter so the counters stay stable).
   * Upcoming reads soonest-first, past reads most-recent-first.
   */
  async findPageByProfile(filters: EventPageFilters) {
    const base: Prisma.EventExecutionWhereInput = {
      eventSeries: {
        profileId: filters.profileId,
        ...(filters.type ? { type: filters.type } : {}),
      },
      ...(filters.q
        ? { content: { contains: filters.q, mode: 'insensitive' } }
        : {}),
    };
    const upcomingWhere: Prisma.EventExecutionWhereInput = {
      ...base,
      status: { in: UPCOMING_EVENT_STATUSES },
    };
    const pastWhere: Prisma.EventExecutionWhereInput = {
      ...base,
      status: { in: PAST_EVENT_STATUSES },
    };
    const pageWhere =
      filters.tab === 'upcoming'
        ? upcomingWhere
        : { ...base, status: filters.status ?? { in: PAST_EVENT_STATUSES } };
    const direction = filters.tab === 'upcoming' ? 'asc' : 'desc';

    const [items, total, upcoming, past] = await this.prisma.$transaction([
      this.prisma.eventExecution.findMany({
        where: pageWhere,
        include: { eventSeries: { select: EVENT_SERIES_SUMMARY_SELECT } },
        orderBy: [{ scheduledAt: direction }, { id: 'asc' }],
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.eventExecution.count({ where: pageWhere }),
      this.prisma.eventExecution.count({ where: upcomingWhere }),
      this.prisma.eventExecution.count({ where: pastWhere }),
    ]);

    return { items, total, counts: { upcoming, past } };
  }

  findOwnedWithSeries(profileId: string, id: string) {
    return this.prisma.eventExecution.findFirst({
      where: { id, eventSeries: { profileId } },
      include: { eventSeries: { select: EVENT_SERIES_SUMMARY_SELECT } },
    });
  }

  /**
   * Updates an execution only while it is still `PENDING`, so an edit can never
   * race with the scheduler claiming it. `count === 0` means it was claimed.
   */
  updatePending(
    id: string,
    data: Prisma.EventExecutionUpdateManyMutationInput,
  ) {
    return this.prisma.eventExecution.updateMany({
      where: { id, status: EventExecutionStatus.PENDING },
      data,
    });
  }
}
