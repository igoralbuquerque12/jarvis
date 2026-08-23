import { forwardRef, Module } from '@nestjs/common';

import { BetterAuthService } from './services/better-auth.service';
import { FinanceModule } from '../finance/finance.module';
import { ProfileModule } from '../profile/profile.module';

@Module({
  imports: [forwardRef(() => ProfileModule), forwardRef(() => FinanceModule)],
  providers: [BetterAuthService],
  exports: [BetterAuthService],
})
export class AuthModule {}
