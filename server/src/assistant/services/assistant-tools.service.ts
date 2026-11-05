import { Injectable } from '@nestjs/common';
import type { Profile } from '@prisma/client';

import { SubscriptionService } from '../../subscription/services/subscription.service';
import type { AssistantRunTools } from '../entities/assistant-run-context';
import { ASSISTANT_TOOLS } from '../tools/main.tools';
import { renderToolsReference } from '../utils/build-system-prompt';
import { filterToolsByPlan } from '../utils/filter-tools-by-plan';

/** Catalogue sent to n8n, narrowed to what the caller's plan unlocks. */
@Injectable()
export class AssistantToolsService {
  private readonly cache = new Map<number, AssistantRunTools>();

  constructor(private readonly subscriptionService: SubscriptionService) {}

  forPlan(plan: number): AssistantRunTools {
    const cached = this.cache.get(plan);

    if (cached) {
      return cached;
    }

    const tools = filterToolsByPlan(ASSISTANT_TOOLS, plan);
    const toolset = { tools, reference: renderToolsReference(tools) };
    this.cache.set(plan, toolset);

    return toolset;
  }

  async forProfile(
    profile: Pick<Profile, 'subscriptionId'>,
  ): Promise<AssistantRunTools> {
    const plan = await this.subscriptionService.findPlanNumber(
      profile.subscriptionId,
    );

    return this.forPlan(plan);
  }
}
