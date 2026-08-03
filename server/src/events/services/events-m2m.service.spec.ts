import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventSeriesType } from '@prisma/client';
import { EventsM2mService } from './events-m2m.service';

describe('EventsM2mService', () => {
  const profile = { findOne: jest.fn() };
  const series = { create: jest.fn(), findOne: jest.fn(), update: jest.fn() };
  const executions = {
    create: jest.fn(),
    cancelPendingBySeriesId: jest.fn(),
    findActive: jest.fn(),
  };
  const service = new EventsM2mService(
    series as never,
    executions as never,
    profile as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('creates a UNIQUE series and its normalized first execution', async () => {
    profile.findOne.mockResolvedValue({
      id: 'profile-id',
      timezone: 'America/Sao_Paulo',
    });
    series.create.mockResolvedValue({ id: 'series-id' });
    executions.create.mockResolvedValue({ id: 'execution-id' });

    await expect(
      service.createEvent({
        profileId: 'profile-id',
        type: EventSeriesType.UNIQUE,
        startAt: '2026-07-25T09:06:00-03:00',
        content: 'Enviar relatório',
      }),
    ).resolves.toEqual({
      eventSeries: { id: 'series-id' },
      eventExecution: { id: 'execution-id' },
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

  it('deactivates a series and cancels its pending executions', async () => {
    series.findOne.mockResolvedValue({ id: 'series-id' });
    series.update.mockResolvedValue({ id: 'series-id', active: false });
    executions.cancelPendingBySeriesId.mockResolvedValue({ count: 3 });

    await expect(service.deleteEvent('series-id')).resolves.toEqual({
      eventSeries: { id: 'series-id', active: false },
      cancelledExecutions: 3,
    });
    expect(executions.cancelPendingBySeriesId).toHaveBeenCalledWith(
      'series-id',
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
