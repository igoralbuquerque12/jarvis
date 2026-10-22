import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EventSeriesType } from '@prisma/client';
import { EVENTS_SCHEDULE_CACHE_KEY } from '../constants/events-cache.constant';
import { EventsMeService } from '../services/events-me.service';

describe('EventsMeService', () => {
  const profile = { id: 'profile-id', timezone: 'America/Sao_Paulo' };
  const executions = {
    findPageByProfile: jest.fn(),
    findOwnedWithSeries: jest.fn(),
    updatePending: jest.fn(),
  };
  const series = { update: jest.fn() };
  const m2m = { createEvent: jest.fn() };
  const redisClient = { del: jest.fn() };
  const redis = { getClient: jest.fn(() => redisClient) };
  const service = new EventsMeService(
    executions as never,
    series as never,
    m2m as never,
    redis as never,
  );

  const seriesSummary = {
    id: 'series-id',
    type: EventSeriesType.UNIQUE,
    active: true,
    recurrenceInterval: null,
    recurrenceMode: null,
  };
  const pending = {
    id: 'exec-id',
    content: 'Pagar boleto',
    scheduledAt: new Date('2030-01-01T12:00:00.000Z'),
    status: 'PENDING',
    observabilitys: null,
    eventSeries: seriesSummary,
  };

  beforeEach(() => jest.clearAllMocks());

  describe('list', () => {
    it('defaults to the upcoming tab, first page of 25', async () => {
      executions.findPageByProfile.mockResolvedValue({
        items: [pending],
        total: 1,
        counts: { upcoming: 1, past: 4 },
      });

      const result = await service.list(profile.id, {});

      expect(executions.findPageByProfile).toHaveBeenCalledWith({
        profileId: profile.id,
        tab: 'upcoming',
        q: undefined,
        type: undefined,
        status: undefined,
        page: 1,
        limit: 25,
      });
      expect(result).toMatchObject({
        total: 1,
        page: 1,
        limit: 25,
        counts: { upcoming: 1, past: 4 },
      });
      expect(result.items[0]).toMatchObject({
        id: 'exec-id',
        series: { id: 'series-id', type: EventSeriesType.UNIQUE },
      });
    });

    it('only applies the status filter on the past tab', async () => {
      executions.findPageByProfile.mockResolvedValue({
        items: [],
        total: 0,
        counts: { upcoming: 0, past: 0 },
      });

      await service.list(profile.id, { tab: 'upcoming', status: 'FAILED' });
      await service.list(profile.id, { tab: 'past', status: 'FAILED' });

      expect(executions.findPageByProfile).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ tab: 'upcoming', status: undefined }),
      );
      expect(executions.findPageByProfile).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ tab: 'past', status: 'FAILED' }),
      );
    });
  });

  describe('create', () => {
    it('rejects a start in the past without creating anything', async () => {
      await expect(
        service.create(profile, {
          type: EventSeriesType.UNIQUE,
          startAt: '2020-01-01T09:00',
          content: 'Passado',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(m2m.createEvent).not.toHaveBeenCalled();
    });

    it('creates through the m2m service for the session profile', async () => {
      m2m.createEvent.mockResolvedValue({
        eventSeries: seriesSummary,
        eventExecution: pending,
      });

      const result = await service.create(profile, {
        type: EventSeriesType.UNIQUE,
        startAt: '2099-01-01T09:00',
        content: 'Futuro',
      });

      expect(m2m.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({ profileId: profile.id, content: 'Futuro' }),
      );
      expect(result.id).toBe('exec-id');
    });
  });

  describe('update', () => {
    it('requires at least one field', async () => {
      await expect(
        service.update(profile, 'exec-id', {}),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('reports a foreign or unknown execution as not found', async () => {
      executions.findOwnedWithSeries.mockResolvedValue(null);

      await expect(
        service.update(profile, 'exec-id', { content: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('refuses executions that are no longer pending', async () => {
      executions.findOwnedWithSeries.mockResolvedValue({
        ...pending,
        status: 'COMPLETED',
      });

      await expect(
        service.update(profile, 'exec-id', { content: 'x' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses when the scheduler claimed it meanwhile', async () => {
      executions.findOwnedWithSeries.mockResolvedValue(pending);
      executions.updatePending.mockResolvedValue({ count: 0 });

      await expect(
        service.update(profile, 'exec-id', { content: 'x' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(redisClient.del).not.toHaveBeenCalled();
    });

    it('maps a duplicate schedule slot to a conflict', async () => {
      executions.findOwnedWithSeries.mockResolvedValue(pending);
      executions.updatePending.mockRejectedValue({ code: 'P2002' });

      await expect(
        service.update(profile, 'exec-id', { startAt: '2099-01-01T09:00' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('reschedules, syncs a UNIQUE series and clears the schedule cache', async () => {
      executions.findOwnedWithSeries.mockResolvedValue(pending);
      executions.updatePending.mockResolvedValue({ count: 1 });

      await service.update(profile, 'exec-id', {
        content: 'Novo texto',
        startAt: '2099-01-01T09:06',
      });

      const scheduledAt = new Date('2099-01-01T12:10:00.000Z');
      expect(executions.updatePending).toHaveBeenCalledWith('exec-id', {
        content: 'Novo texto',
        scheduledAt,
      });
      expect(series.update).toHaveBeenCalledWith('series-id', {
        startAt: scheduledAt,
      });
      expect(redisClient.del).toHaveBeenCalledWith(EVENTS_SCHEDULE_CACHE_KEY);
    });

    it('leaves a recurring series start untouched', async () => {
      executions.findOwnedWithSeries.mockResolvedValue({
        ...pending,
        eventSeries: { ...seriesSummary, type: EventSeriesType.RECURRENCE },
      });
      executions.updatePending.mockResolvedValue({ count: 1 });

      await service.update(profile, 'exec-id', { startAt: '2099-01-01T09:00' });

      expect(series.update).not.toHaveBeenCalled();
    });
  });
});
