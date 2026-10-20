// better-auth ships ESM only; the service just needs `getSession`.
jest.mock('../../auth/services/better-auth.service', () => ({
  BetterAuthService: class {},
}));

import { UnauthorizedException } from '@nestjs/common';
import type { Profile } from '@prisma/client';
import type { Request } from 'express';
import { BetterAuthService } from '../../auth/services/better-auth.service';
import { PrismaService } from '../../prisma/services/prisma.service';
import { PlanRequiredException } from '../errors/plan-required.exception';
import { PlanAccessService } from './plan-access.service';
import { SubscriptionService } from './subscription.service';

function createMocks() {
  return {
    prisma: {
      profile: { findUnique: jest.fn() },
    },
    auth: { getSession: jest.fn() },
    subscriptions: { findPlanNumber: jest.fn() },
  };
}

const buildRequest = (overrides: Partial<Request> = {}) =>
  ({ headers: {}, ...overrides }) as Request;

describe('PlanAccessService', () => {
  let mocks: ReturnType<typeof createMocks>;
  let service: PlanAccessService;

  beforeEach(() => {
    mocks = createMocks();
    service = new PlanAccessService(
      mocks.prisma as unknown as PrismaService,
      mocks.auth as unknown as BetterAuthService,
      mocks.subscriptions as unknown as SubscriptionService,
    );
  });

  const sessionWithPlan = (plan: number) => {
    mocks.auth.getSession.mockResolvedValue({ user: { id: 'user-1' } });
    mocks.prisma.profile.findUnique.mockResolvedValue({
      id: 'profile-1',
      subscription: { plan },
    });
  };

  it('allows a plan equal to the minimum', async () => {
    sessionWithPlan(2);

    await expect(
      service.assertAccess(buildRequest(), 2),
    ).resolves.toBeUndefined();
  });

  it('allows a plan above the minimum', async () => {
    sessionWithPlan(3);

    await expect(
      service.assertAccess(buildRequest(), 2),
    ).resolves.toBeUndefined();
  });

  it('blocks a plan below the minimum with plan_required', async () => {
    sessionWithPlan(1);

    const error = await service
      .assertAccess(buildRequest(), 2)
      .catch((thrown: unknown) => thrown);

    expect(error).toBeInstanceOf(PlanRequiredException);
    expect((error as PlanRequiredException).getStatus()).toBe(403);
    expect((error as PlanRequiredException).getResponse()).toMatchObject({
      code: 'plan_required',
      requiredPlan: 2,
      currentPlan: 1,
    });
  });

  it('resolves the API key owner before looking for a session', async () => {
    mocks.subscriptions.findPlanNumber.mockResolvedValue(3);
    const request = buildRequest({
      apiKeyProfile: { id: 'profile-9', subscriptionId: 'sub-3' } as Profile,
    });

    await expect(service.resolvePlanContext(request)).resolves.toEqual({
      profileId: 'profile-9',
      plan: 3,
    });
    expect(mocks.subscriptions.findPlanNumber).toHaveBeenCalledWith('sub-3');
    expect(mocks.auth.getSession).not.toHaveBeenCalled();
  });

  it('resolves the web session profile', async () => {
    sessionWithPlan(2);

    await expect(service.resolvePlanContext(buildRequest())).resolves.toEqual({
      profileId: 'profile-1',
      plan: 2,
    });
    expect(mocks.prisma.profile.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } }),
    );
  });

  it('judges a session without a provisioned profile as the free tier', async () => {
    mocks.auth.getSession.mockResolvedValue({ user: { id: 'user-1' } });
    mocks.prisma.profile.findUnique.mockResolvedValue(null);

    await expect(service.resolvePlanContext(buildRequest())).resolves.toEqual({
      profileId: null,
      plan: 1,
    });
  });

  it('rejects with 401 when there is no identity', async () => {
    mocks.auth.getSession.mockResolvedValue(null);

    await expect(
      service.assertAccess(buildRequest(), 1),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('resolves once per request', async () => {
    sessionWithPlan(2);
    const request = buildRequest();

    await service.assertAccess(request, 1);
    await service.assertAccess(request, 2);

    expect(mocks.auth.getSession).toHaveBeenCalledTimes(1);
    expect(request.planContext).toEqual({ profileId: 'profile-1', plan: 2 });
  });
});
