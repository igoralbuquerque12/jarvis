import { forwardRef, Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { AssistantToolGuard } from '../assistant/guards/assistant-tool.guard';
import { AuthModule } from '../auth/auth.module';
import { ProfileModule } from '../profile/profile.module';
import { DatabaseInformationM2mController } from './controllers/database-information-m2m.controller';
import { DatabaseInformationController } from './controllers/database-information.controller';
import { DatabaseInformationService } from './services/database-information.service';

@Module({
  imports: [
    AiModule,
    forwardRef(() => AuthModule),
    forwardRef(() => ProfileModule),
  ],
  controllers: [
    DatabaseInformationController,
    DatabaseInformationM2mController,
  ],
  providers: [DatabaseInformationService, AssistantToolGuard],
  exports: [DatabaseInformationService],
})
export class DatabaseInformationModule {}
