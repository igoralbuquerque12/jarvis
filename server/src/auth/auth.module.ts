import { forwardRef, Module } from '@nestjs/common';

import { BetterAuthService } from './better-auth.service';
import { ProfileModule } from '../profile/profile.module';

@Module({
  imports: [forwardRef(() => ProfileModule)],
  providers: [BetterAuthService],
  exports: [BetterAuthService],
})
export class AuthModule {}
