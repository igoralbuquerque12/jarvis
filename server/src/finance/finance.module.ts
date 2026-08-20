import { forwardRef, Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { ProfileModule } from '../profile/profile.module';
import { FinanceController } from './controllers/finance.controller';
import { FinanceM2mController } from './controllers/finance-m2m.controller';
import { FinanceService } from './services/finance.service';
import { SecuroApiService } from './services/securo-api.service';
import { SecuroProvisioningService } from './services/securo-provisioning.service';

@Module({
  imports: [forwardRef(() => AuthModule), ProfileModule],
  controllers: [FinanceController, FinanceM2mController],
  providers: [SecuroApiService, SecuroProvisioningService, FinanceService],
  exports: [SecuroProvisioningService],
})
export class FinanceModule {}
