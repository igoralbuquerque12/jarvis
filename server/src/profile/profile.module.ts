import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [forwardRef(() => AuthModule), SubscriptionModule],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
