import { Injectable } from '@nestjs/common';
import { SecuroApiService } from '../../core/services/securo-api.service';
import { SecuroContextService } from '../../core/services/securo-context.service';
import { CreateRuleDto } from '../dto/create-rule.dto';
import { UpdateRuleDto } from '../dto/update-rule.dto';

@Injectable()
export class RulesService {
  constructor(
    private readonly securoApi: SecuroApiService,
    private readonly securoContext: SecuroContextService,
  ) { }

  async findRules(profileId: string) {
    const context = await this.securoContext.contextFor(profileId);

    return this.securoApi.request({
      method: 'GET',
      path: '/api/rules',
      ...this.securoContext.auth(context),
    });
  }

  async createRule(profileId: string, data: CreateRuleDto) {
    const context = await this.securoContext.contextFor(profileId);

    return this.securoApi.request({
      method: 'POST',
      path: '/api/rules',
      ...this.securoContext.auth(context),
      body: this.securoContext.compact({
        name: data.name,
        conditions: data.conditions,
        actions: data.actions,
        conditions_op: data.conditionsOp,
        priority: data.priority,
        is_active: data.isActive,
        apply_to_existing: data.applyToExisting,
        overwrite_existing_categories: data.overwriteExistingCategories,
      }),
    });
  }

  async updateRule(profileId: string, ruleId: string, data: UpdateRuleDto) {
    const context = await this.securoContext.contextFor(profileId);

    return this.securoApi.request({
      method: 'PATCH',
      path: `/api/rules/${ruleId}`,
      ...this.securoContext.auth(context),
      body: this.securoContext.compact({
        name: data.name,
        conditions: data.conditions,
        actions: data.actions,
        conditions_op: data.conditionsOp,
        priority: data.priority,
        is_active: data.isActive,
      }),
    });
  }

  async removeRule(profileId: string, ruleId: string) {
    const context = await this.securoContext.contextFor(profileId);

    await this.securoApi.request({
      method: 'DELETE',
      path: `/api/rules/${ruleId}`,
      ...this.securoContext.auth(context),
    });

    return { deleted: true, ruleId };
  }
}
