import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { REQUIRED_PLAN_KEY } from '../constants/plan-access.constant';
import { PlanGuard } from '../guards/plan.guard';

/**
 * Restricts a controller or a single route to profiles whose plan number is
 * >= `minimumPlan`. The route-level value wins over the controller-level one.
 *
 * Must run after the route's authentication guard: on a class that also has
 * `@UseGuards(ApiKeyGuard)`, write `@RequiresPlan` above it.
 */
export function RequiresPlan(minimumPlan: number) {
  return applyDecorators(
    SetMetadata(REQUIRED_PLAN_KEY, minimumPlan),
    UseGuards(PlanGuard),
  );
}
