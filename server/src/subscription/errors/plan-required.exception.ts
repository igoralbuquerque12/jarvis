import { ForbiddenException } from '@nestjs/common';

/** The caller's plan ranks below the minimum the route requires. */
export class PlanRequiredException extends ForbiddenException {
  constructor(
    public readonly requiredPlan: number,
    public readonly currentPlan: number,
  ) {
    super({
      code: 'plan_required',
      message: 'Seu plano atual não inclui este recurso.',
      requiredPlan,
      currentPlan,
    });
  }
}
