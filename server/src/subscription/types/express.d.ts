declare module 'express-serve-static-core' {
  interface Request {
    /** Caller's plan, resolved once by `PlanAccessService` on plan-gated routes. */
    planContext?: { profileId: string | null; plan: number };
  }
}

export {};
