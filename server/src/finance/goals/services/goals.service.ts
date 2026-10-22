import { Injectable } from '@nestjs/common';
import { FINANCE_DEFAULT_CURRENCY } from '../../core/constants/finance-defaults.constant';
import { SecuroApiService } from '../../core/services/securo-api.service';
import { SecuroContextService } from '../../core/services/securo-context.service';
import { CreateGoalDto } from '../dto/create-goal.dto';
import { FindGoalsDto } from '../dto/find-goals.dto';
import { UpdateGoalDto } from '../dto/update-goal.dto';

@Injectable()
export class GoalsService {
  constructor(
    private readonly securoApi: SecuroApiService,
    private readonly securoContext: SecuroContextService,
  ) {}

  async findGoals(profileId: string, filters: FindGoalsDto) {
    const context = await this.securoContext.contextFor(profileId);

    return this.securoApi.request({
      method: 'GET',
      path: '/api/goals',
      ...this.securoContext.auth(context),
      query: this.securoContext.compact({ status: filters.status }),
    });
  }

  async createGoal(profileId: string, data: CreateGoalDto) {
    const context = await this.securoContext.contextFor(profileId);

    return this.securoApi.request({
      method: 'POST',
      path: '/api/goals',
      ...this.securoContext.auth(context),
      body: this.securoContext.compact({
        name: data.name,
        target_amount: this.securoContext.money(data.targetAmount),
        current_amount: this.securoContext.money(data.currentAmount),
        currency: data.currency ?? FINANCE_DEFAULT_CURRENCY,
        target_date: data.targetDate,
        tracking_type: 'manual',
        icon: data.icon,
        color: data.color,
      }),
    });
  }

  async updateGoal(profileId: string, goalId: string, data: UpdateGoalDto) {
    const context = await this.securoContext.contextFor(profileId);

    return this.securoApi.request({
      method: 'PATCH',
      path: `/api/goals/${goalId}`,
      ...this.securoContext.auth(context),
      body: this.securoContext.compact({
        name: data.name,
        target_amount: this.securoContext.money(data.targetAmount),
        current_amount: this.securoContext.money(data.currentAmount),
        target_date: data.targetDate,
        status: data.status,
      }),
    });
  }

  async removeGoal(profileId: string, goalId: string) {
    const context = await this.securoContext.contextFor(profileId);

    await this.securoApi.request({
      method: 'DELETE',
      path: `/api/goals/${goalId}`,
      ...this.securoContext.auth(context),
    });

    return { deleted: true, goalId };
  }
}
