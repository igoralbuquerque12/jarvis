import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { BetterAuthService } from '../../auth/services/better-auth.service';
import { PrismaService } from '../../prisma/services/prisma.service';
import {
  FREE_TIER_PLAN,
  hasPlanAccess,
} from '../constants/subscription-plans.constant';
import { PlanRequiredException } from '../errors/plan-required.exception';
import { SubscriptionService } from './subscription.service';

export interface PlanContext {
  profileId: string | null;
  plan: number;
}

@Injectable()
export class PlanAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: BetterAuthService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  /** Throws 401 without an identity and 403 `plan_required` below `minimumPlan`. */
  async assertAccess(request: Request, minimumPlan: number): Promise<void> {
    const { plan } = await this.resolvePlanContext(request);

    if (!hasPlanAccess(plan, minimumPlan)) {
      throw new PlanRequiredException(minimumPlan, plan);
    }
  }

  /**
   * Who is calling, from the most to the least specific source:
   * the API key owner (set by `ApiKeyGuard`), then the web session.
   */
  async resolvePlanContext(request: Request): Promise<PlanContext> {
    if (request.planContext) {
      return request.planContext;
    }

    const context = request.apiKeyProfile
      ? {
          profileId: request.apiKeyProfile.id,
          plan: await this.subscriptionService.findPlanNumber(
            request.apiKeyProfile.subscriptionId,
          ),
        }
      : await this.resolveFromSession(request);

    request.planContext = context;
    return context;
  }

  private async resolveFromSession(request: Request): Promise<PlanContext> {
    const session = await this.authService.getSession(request.headers);

    if (!session) {
      throw new UnauthorizedException('Session is required.');
    }

    const profile = await this.prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, subscription: { select: { plan: true } } },
    });

    // A profile not provisioned yet is created on the default plan by
    // `ProfileService.ensureAuthProfile`, so it is judged as that plan.
    return {
      profileId: profile?.id ?? null,
      plan: profile?.subscription.plan ?? FREE_TIER_PLAN,
    };
  }
}
