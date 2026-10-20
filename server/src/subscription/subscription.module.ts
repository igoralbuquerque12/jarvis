import { forwardRef, Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionController } from './controllers/subscription.controller';
import { PlanGuard } from './guards/plan.guard';
import { PlanAccessService } from './services/plan-access.service';
import { SubscriptionService } from './services/subscription.service';

/**
 * Global so any module can use `@RequiresPlan` (PlanGuard + PlanAccessService)
 * without importing it.
 */
@Global()
@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, PlanAccessService, PlanGuard],
  exports: [SubscriptionService, PlanAccessService, PlanGuard],
})
export class SubscriptionModule {}
