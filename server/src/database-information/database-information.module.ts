import { forwardRef, Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { ProfileModule } from '../profile/profile.module';
import { DatabaseInformationController } from './controllers/database-information.controller';
import { KnowledgeIndexSchedule } from './schedules/knowledge-index.schedule';
import { DatabaseInformationService } from './services/database-information.service';
import { DatabaseInformationToolService } from './services/database-information-tool.service';
import { KnowledgeIndexerService } from './services/knowledge-indexer.service';
import { KnowledgeSearchService } from './services/knowledge-search.service';

@Module({
  imports: [
    AiModule,
    forwardRef(() => AuthModule),
    forwardRef(() => ProfileModule),
  ],
  controllers: [DatabaseInformationController],
  providers: [
    DatabaseInformationService,
    DatabaseInformationToolService,
    KnowledgeIndexerService,
    KnowledgeSearchService,
    KnowledgeIndexSchedule,
  ],
  exports: [DatabaseInformationService],
})
export class DatabaseInformationModule {}
