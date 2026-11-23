import { forwardRef, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';

import { AssistantMainService } from './services/assistant-main.service';
import { ProfileModule } from '../profile/profile.module';
import { MessagesModule } from '../messages/messages.module';
import { AssistantWorkflowService } from './services/assistant-workflow.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { AssistantConnectionService } from './services/assistant-connection.service';
import { AssistantToolsService } from './services/assistant-tools.service';
import { AssistantToolGuard } from './guards/assistant-tool.guard';
import { DatabaseInformationModule } from '../database-information/database-information.module';
import { AssistantM2mController } from './controllers/assistant-m2m.controller';
import { AssistantRunService } from './services/assistant-run.service';
import { AssistantContextService } from './services/assistant-context.service';
import { AssistantToolRegistry } from './services/assistant-tool-registry.service';
import { AssistantToolDispatcherService } from './services/assistant-tool-dispatcher.service';
import { AssistantMessageService } from './services/assistant-message.service';
import { AssistantAudioService } from './services/assistant-audio.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    DiscoveryModule,
    AiModule,
    forwardRef(() => ProfileModule),
    MessagesModule,
    DatabaseInformationModule,
    forwardRef(() => WhatsappModule),
  ],
  controllers: [AssistantM2mController],
  providers: [
    AssistantMainService,
    AssistantWorkflowService,
    AssistantConnectionService,
    AssistantToolsService,
    AssistantToolGuard,
    AssistantRunService,
    AssistantContextService,
    AssistantToolRegistry,
    AssistantToolDispatcherService,
    AssistantMessageService,
    AssistantAudioService,
  ],
  exports: [AssistantMainService],
})
export class AssistantModule {}
