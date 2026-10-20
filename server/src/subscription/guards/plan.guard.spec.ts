// better-auth ships ESM only; PlanAccessService is mocked here anyway.
jest.mock('../../auth/services/better-auth.service', () => ({
  BetterAuthService: class {},
}));

import {
  Controller,
  Get,
  UseGuards,
  type ExecutionContext,
} from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { ApiKeyGuard } from '../../api-keys/guards/api-key.guard';
import { RequiresPlan } from '../decorators/requires-plan.decorator';
import { PlanAccessService } from '../services/plan-access.service';
import { PlanGuard } from './plan.guard';

@RequiresPlan(2)
@Controller('gated')
class GatedController {
  @Get()
  inherited() {}

  @RequiresPlan(3)
  @Get('premium')
  premium() {}
}

@Controller('open')
class OpenController {
  @Get()
  open() {}
}

function buildContext(
  controller: new () => object,
  handler: string,
): ExecutionContext {
  const request = { headers: {} };

  return {
    getClass: () => controller,
    getHandler: () =>
      (controller.prototype as Record<string, () => void>)[handler],
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('PlanGuard', () => {
  let planAccess: { assertAccess: jest.Mock };
  let guard: PlanGuard;

  beforeEach(() => {
    planAccess = { assertAccess: jest.fn().mockResolvedValue(undefined) };
    guard = new PlanGuard(
      new Reflector(),
      planAccess as unknown as PlanAccessService,
    );
  });

  it('lets routes without a plan requirement through', async () => {
    await expect(
      guard.canActivate(buildContext(OpenController, 'open')),
    ).resolves.toBe(true);
    expect(planAccess.assertAccess).not.toHaveBeenCalled();
  });

  it('uses the controller-level minimum', async () => {
    await guard.canActivate(buildContext(GatedController, 'inherited'));

    expect(planAccess.assertAccess).toHaveBeenCalledWith(expect.anything(), 2);
  });

  it('lets the route-level minimum override the controller one', async () => {
    await guard.canActivate(buildContext(GatedController, 'premium'));

    expect(planAccess.assertAccess).toHaveBeenCalledWith(expect.anything(), 3);
  });

  it('propagates the denial from the service', async () => {
    planAccess.assertAccess.mockRejectedValue(new Error('denied'));

    await expect(
      guard.canActivate(buildContext(GatedController, 'inherited')),
    ).rejects.toThrow('denied');
  });
});

describe('RequiresPlan guard order', () => {
  it('runs after the auth guard when written above @UseGuards', () => {
    @RequiresPlan(2)
    @UseGuards(ApiKeyGuard)
    @Controller('keyed')
    class KeyedController {}

    expect(Reflect.getMetadata(GUARDS_METADATA, KeyedController)).toEqual([
      ApiKeyGuard,
      PlanGuard,
    ]);
  });
});
