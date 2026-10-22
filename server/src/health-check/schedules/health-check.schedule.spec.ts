import { HealthCheckExecutionService } from '../services/health-check-execution.service';
import { HealthCheckSchedule } from './health-check.schedule';

describe('HealthCheckSchedule', () => {
  it('delegates cron execution to HealthCheckExecutionService', async () => {
    const executionService = {
      runHealthChecks: jest.fn().mockResolvedValue(undefined),
    };
    const schedule = new HealthCheckSchedule(
      executionService as unknown as HealthCheckExecutionService,
    );

    await schedule.handleCron();

    expect(executionService.runHealthChecks).toHaveBeenCalledTimes(1);
  });
});
