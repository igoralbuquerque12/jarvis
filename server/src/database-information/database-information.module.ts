import { forwardRef, Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { ProfileModule } from '../profile/profile.module';
import { DatabaseInformationController } from './controllers/database-information.controller';
import { DatabaseInformationService } from './services/database-information.service';
import { DatabaseInformationToolService } from './services/database-information-tool.service';

@Module({
  imports: [
    AiModule,
    forwardRef(() => AuthModule),
    forwardRef(() => ProfileModule),
  ],
  controllers: [DatabaseInformationController],
  providers: [DatabaseInformationService, DatabaseInformationToolService],
  exports: [DatabaseInformationService],
})
export class DatabaseInformationModule {}
