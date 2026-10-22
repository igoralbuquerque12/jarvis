import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { HEALTH_CHECK_CRON_EXPRESSION } from '../constants/health-check.constant';
import { HealthCheckExecutionService } from '../services/health-check-execution.service';

@Injectable()
export class HealthCheckSchedule {
  constructor(
    private readonly healthCheckExecutionService: HealthCheckExecutionService,
  ) {}

  @Cron(HEALTH_CHECK_CRON_EXPRESSION)
  async handleCron(): Promise<void> {
    await this.healthCheckExecutionService.runHealthChecks();
  }
}
