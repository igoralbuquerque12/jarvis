import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { REQUIRED_PLAN_KEY } from '../constants/plan-access.constant';
import { PlanAccessService } from '../services/plan-access.service';

/**
 * Applied through `@RequiresPlan(n)`. A route-level minimum overrides the
 * controller-level one; the decision itself lives in `PlanAccessService`.
 */
@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly planAccessService: PlanAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const minimumPlan = this.reflector.getAllAndOverride<number | undefined>(
      REQUIRED_PLAN_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (minimumPlan === undefined) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    await this.planAccessService.assertAccess(request, minimumPlan);

    return true;
  }
}
