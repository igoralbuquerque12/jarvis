import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EventSeriesType, RecurrenceMode } from '@prisma/client';
import { DateTime } from 'luxon';
import {
  EVENTS_ASSISTANT_CACHE_TTL_SECONDS,
  getEventsAssistantCacheKey,
} from '../constants/events-cache.constant';
import { EventsM2mService } from '../services/events-m2m.service';

describe('EventsM2mService', () => {
  const profile = { findOne: jest.fn() };
  const series = { create: jest.fn(), findOne: jest.fn(), update: jest.fn() };
  const executions = {
    create: jest.fn(),
    cancelPendingBySeriesId: jest.fn(),
    findActive: jest.fn(),
    findPendingBySeriesOrExecutionId: jest.fn(),
    findOwnedWithSeries: jest.fn(),
    updatePending: jest.fn(),
  };
  const redisClient = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };
  const redis = { getClient: jest.fn(() => redisClient) };
  const service = new EventsM2mService(
    series as never,
    executions as never,
    profile as never,
    redis as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    redisClient.get.mockResolvedValue(null);
    redisClient.set.mockResolvedValue('OK');
    redisClient.del.mockResolvedValue(1);
  });

  it('creates a UNIQUE series, normalizes its first execution, and caches it', async () => {
    profile.findOne.mockResolvedValue({
      id: 'profile-id',
      timezone: 'America/Sao_Paulo',
    });
    series.create.mockResolvedValue({
      id: 'series-id',
      type: EventSeriesType.UNIQUE,
      recurrenceInterval: null,
      recurrenceMode: null,
    });
    executions.create.mockResolvedValue({
      id: 'execution-id',
      content: 'Oi, Igor. Você me pediu para te lembrar de lavar o carro.',
    });

    await expect(
      service.createEvent({
        profileId: 'profile-id',
        type: EventSeriesType.UNIQUE,
        startAt: '2026-07-25T09:06:00-03:00',
        content: 'Oi, Igor. Você me pediu para te lembrar de lavar o carro.',
      }),
    ).resolves.toEqual({
      eventSeries: {
        id: 'series-id',
        type: EventSeriesType.UNIQUE,
        recurrenceInterval: null,
        recurrenceMode: null,
      },
      eventExecution: {
        id: 'execution-id',
        content: 'Oi, Igor. Você me pediu para te lembrar de lavar o carro.',
      },
      scheduledAtLocal: '2026-07-25T09:10:00-03:00',
    });

    expect(series.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: EventSeriesType.UNIQUE }),
    );
    expect(executions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventSeriesId: 'series-id',
        scheduledAt: new Date('2026-07-25T12:10:00.000Z'),
      }),
    );
    expect(redisClient.set).toHaveBeenCalledWith(
      getEventsAssistantCacheKey('profile-id'),
      expect.stringContaining('series-id'),
      {
        expiration: { type: 'EX', value: EVENTS_ASSISTANT_CACHE_TTL_SECONDS },
      },
    );
  });

  it('requires both recurrence fields for RECURRENCE', async () => {
    profile.findOne.mockResolvedValue({
      id: 'profile-id',
      timezone: 'America/Sao_Paulo',
    });

    await expect(
      service.createEvent({
        profileId: 'profile-id',
        type: EventSeriesType.RECURRENCE,
        startAt: '2026-07-25T09:00:00-03:00',
        content: 'Verificar pedidos',
        recurrenceInterval: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deactivates a series, cancels pending executions, and removes it from cache', async () => {
    series.findOne.mockResolvedValue({
      id: 'series-id',
      profileId: 'profile-id',
    });
    series.update.mockResolvedValue({ id: 'series-id', active: false });
    executions.cancelPendingBySeriesId.mockResolvedValue({ count: 3 });
    redisClient.get.mockResolvedValue(
      JSON.stringify([
        {
          id: 'exec-1',
          eventSeriesId: 'series-id',
          content: 'Oi, Igor. Você me pediu para te lembrar de lavar o carro.',
          scheduledAtLocal: '2026-07-25T09:10:00-03:00',
          type: 'UNIQUE',
          recurrenceInterval: null,
          recurrenceMode: null,
        },
      ]),
    );

    await expect(
      service.deleteEvent('profile-id', 'series-id'),
    ).resolves.toEqual({
      eventSeries: { id: 'series-id', active: false },
      cancelledExecutions: 3,
    });
    expect(executions.cancelPendingBySeriesId).toHaveBeenCalledWith(
      'series-id',
    );
    expect(redisClient.del).toHaveBeenCalledWith(
      getEventsAssistantCacheKey('profile-id'),
    );
  });

  it('filters active executions by the profile local calendar day and type', async () => {
    profile.findOne.mockResolvedValue({
      id: 'profile-id',
      timezone: 'America/Sao_Paulo',
    });
    executions.findActive.mockResolvedValue([]);

    await service.findActiveEvents({
      profileId: 'profile-id',
      scheduledAt: '2026-07-25',
      type: EventSeriesType.RECURRENCE,
    });

    expect(executions.findActive).toHaveBeenCalledWith({
      profileId: 'profile-id',
      type: EventSeriesType.RECURRENCE,
      scheduledAtStart: new Date('2026-07-25T03:00:00.000Z'),
      scheduledAtEnd: new Date('2026-07-26T03:00:00.000Z'),
    });
  });

  it.each([
    ['TODAY', 1],
    ['NEXT_3_DAYS', 3],
    ['NEXT_7_DAYS', 7],
    ['NEXT_30_DAYS', 30],
  ] as const)(
    'applies predefined date range filter %s (%i days)',
    async (filter, days) => {
      const timezone = 'America/Sao_Paulo';
      profile.findOne.mockResolvedValue({ id: 'profile-id', timezone });
      executions.findActive.mockResolvedValue([]);

      await service.findActiveEvents({
        profileId: 'profile-id',
        filter,
      });

      const todayStart = DateTime.now().setZone(timezone).startOf('day');
      expect(executions.findActive).toHaveBeenCalledWith({
        profileId: 'profile-id',
        type: undefined,
        scheduledAtStart: todayStart.toUTC().toJSDate(),
        scheduledAtEnd: todayStart.plus({ days }).toUTC().toJSDate(),
      });
    },
  );

  it('applies RECURRING filter to fetch all recurring events', async () => {
    profile.findOne.mockResolvedValue({
      id: 'profile-id',
      timezone: 'America/Sao_Paulo',
    });
    executions.findActive.mockResolvedValue([]);

    await service.findActiveEvents({
      profileId: 'profile-id',
      filter: 'RECURRING',
    });

    expect(executions.findActive).toHaveBeenCalledWith({
      profileId: 'profile-id',
      type: EventSeriesType.RECURRENCE,
      scheduledAtStart: undefined,
      scheduledAtEnd: undefined,
    });
  });

  it('updates a pending event content, schedule, and cache', async () => {
    profile.findOne.mockResolvedValue({
      id: 'profile-id',
      timezone: 'America/Sao_Paulo',
    });
    const existingSeries = {
      id: 'series-id',
      profileId: 'profile-id',
      type: EventSeriesType.UNIQUE,
      active: true,
      recurrenceInterval: null,
      recurrenceMode: null,
    };
    executions.findPendingBySeriesOrExecutionId.mockResolvedValue({
      id: 'exec-id',
      eventSeriesId: 'series-id',
      content: 'Antigo',
      scheduledAt: new Date('2026-07-25T12:00:00.000Z'),
      status: 'PENDING',
      eventSeries: existingSeries,
    });
    executions.updatePending.mockResolvedValue({ count: 1 });
    series.update.mockResolvedValue({
      ...existingSeries,
      type: EventSeriesType.RECURRENCE,
      recurrenceInterval: 1,
      recurrenceMode: RecurrenceMode.DAY,
    });

    const result = await service.updateEvent({
      profileId: 'profile-id',
      eventSeriesId: 'series-id',
      content: 'Oi, Igor. Você me pediu para te lembrar de lavar o carro.',
      startAt: '2026-07-25T15:04:00-03:00',
      type: EventSeriesType.RECURRENCE,
      recurrenceInterval: 1,
      recurrenceMode: RecurrenceMode.DAY,
    });

    expect(executions.updatePending).toHaveBeenCalledWith('exec-id', {
      content: 'Oi, Igor. Você me pediu para te lembrar de lavar o carro.',
      scheduledAt: new Date('2026-07-25T18:00:00.000Z'),
    });
    expect(series.update).toHaveBeenCalledWith('series-id', {
      type: EventSeriesType.RECURRENCE,
      recurrenceInterval: 1,
      recurrenceMode: RecurrenceMode.DAY,
    });
    expect(result.scheduledAtLocal).toBe('2026-07-25T15:00:00-03:00');
    expect(redisClient.set).toHaveBeenCalledWith(
      getEventsAssistantCacheKey('profile-id'),
      expect.stringContaining('lavar o carro'),
      expect.any(Object),
    );
  });

  it('rejects updateEvent when no fields are provided or event is not pending', async () => {
    await expect(
      service.updateEvent({
        profileId: 'profile-id',
        eventSeriesId: 'series-id',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    profile.findOne.mockResolvedValue({
      id: 'profile-id',
      timezone: 'America/Sao_Paulo',
    });
    executions.findPendingBySeriesOrExecutionId.mockResolvedValue({
      id: 'exec-id',
      status: 'COMPLETED',
      eventSeries: { id: 'series-id', active: true },
    });

    await expect(
      service.updateEvent({
        profileId: 'profile-id',
        eventSeriesId: 'series-id',
        content: 'Novo',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('clears the schedule cache when the event fires within the cache window', async () => {
    profile.findOne.mockResolvedValue({
      id: 'profile-id',
      timezone: 'UTC',
    });
    series.create.mockResolvedValue({ id: 'series-id' });
    executions.create.mockResolvedValue({ id: 'execution-id' });

    const startAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await service.createEvent({
      profileId: 'profile-id',
      type: EventSeriesType.UNIQUE,
      startAt,
      content: 'Enviar relatório',
    });

    expect(redisClient.del).toHaveBeenCalledWith(
      'events:schedule:pending-cache',
    );
  });

  it('keeps the schedule cache when the event fires after the cache window', async () => {
    profile.findOne.mockResolvedValue({
      id: 'profile-id',
      timezone: 'UTC',
    });
    series.create.mockResolvedValue({ id: 'series-id' });
    executions.create.mockResolvedValue({ id: 'execution-id' });

    const startAt = new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString();

    await service.createEvent({
      profileId: 'profile-id',
      type: EventSeriesType.UNIQUE,
      startAt,
      content: 'Enviar relatório',
    });

    expect(redisClient.del).not.toHaveBeenCalledWith(
      'events:schedule:pending-cache',
    );
  });

  it('rejects an unknown profile', async () => {
    profile.findOne.mockResolvedValue(null);

    await expect(
      service.createEvent({
        profileId: 'missing',
        type: EventSeriesType.UNIQUE,
        startAt: '2026-07-25T09:00:00-03:00',
        content: 'Mensagem',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
