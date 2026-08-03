import {
  EventExecutionStatus,
  EventSeriesType,
  RecurrenceMode,
} from '@prisma/client';
import { EventsSchedule } from './events.schedule';

describe('EventsSchedule', () => {
  const executions = {
    findPendingDue: jest.fn(),
    markAsProcessing: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  };
  const series = { findOne: jest.fn(), update: jest.fn() };
  const whatsapp = { sendMessage: jest.fn() };
  const schedule = new EventsSchedule(
    executions as never,
    series as never,
    whatsapp as never,
  );

  const recurringExecution = {
    id: 'execution-id',
    eventSeriesId: 'series-id',
    scheduledAt: new Date('2026-07-25T09:00:00Z'),
    content: 'Verificar pedidos',
    eventSeries: {
      profile: { jid: '5511999999999', timezone: 'UTC' },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    executions.findPendingDue.mockResolvedValue([recurringExecution]);
    executions.markAsProcessing.mockResolvedValue({ count: 1 });
    executions.update.mockResolvedValue({});
    executions.create.mockResolvedValue({});
    whatsapp.sendMessage.mockResolvedValue({ sent: true });
    series.findOne.mockResolvedValue({
      id: 'series-id',
      active: true,
      type: EventSeriesType.RECURRENCE,
      recurrenceMode: RecurrenceMode.HOUR,
      recurrenceInterval: 1,
    });
  });

  it('completes a successful execution and creates the next recurrence', async () => {
    await schedule.processDueEvents();

    expect(whatsapp.sendMessage).toHaveBeenCalledWith(
      '5511999999999',
      'Verificar pedidos',
    );
    expect(executions.update).toHaveBeenCalledWith('execution-id', {
      status: EventExecutionStatus.COMPLETED,
    });
    expect(executions.create).toHaveBeenCalledWith(
      expect.objectContaining({ eventSeriesId: 'series-id' }),
    );
  });

  it('records the error and still creates the next recurrence', async () => {
    whatsapp.sendMessage.mockRejectedValue(new Error('WhatsApp indisponível'));

    await schedule.processDueEvents();

    expect(executions.update).toHaveBeenCalledWith('execution-id', {
      status: EventExecutionStatus.FAILED,
      observabilitys: 'WhatsApp indisponível',
    });
    expect(executions.create).toHaveBeenCalled();
  });

  it('does not create a recurrence after the series is inactive', async () => {
    series.findOne.mockResolvedValue({ id: 'series-id', active: false });

    await schedule.processDueEvents();

    expect(executions.create).not.toHaveBeenCalled();
  });

  it('deactivates a completed UNIQUE series', async () => {
    series.findOne.mockResolvedValue({
      id: 'series-id',
      active: true,
      type: EventSeriesType.UNIQUE,
    });

    await schedule.processDueEvents();

    expect(series.update).toHaveBeenCalledWith('series-id', { active: false });
    expect(executions.create).not.toHaveBeenCalled();
  });
});
