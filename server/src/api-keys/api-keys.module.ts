import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProfileModule } from '../profile/profile.module';
import { ApiKeysController } from './controllers/api-keys.controller';
import { ApiKeyGuard } from './guards/api-key.guard';
import { ApiKeysService } from './services/api-keys.service';

@Module({
  imports: [forwardRef(() => AuthModule), forwardRef(() => ProfileModule)],
  controllers: [ApiKeysController],
  providers: [ApiKeysService, ApiKeyGuard],
  exports: [ApiKeysService, ApiKeyGuard],
})
export class ApiKeysModule {}
