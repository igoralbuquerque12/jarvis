import { forwardRef, Module } from '@nestjs/common';

import { AssistantMainService } from './services/assistant-main.service';
import { ProfileModule } from '../profile/profile.module';
import { MessagesModule } from '../messages/messages.module';
import { AssistantWorkflowService } from './services/assistant-workflow.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { AssistantConnectionService } from './services/assistant-connection.service';
import { AssistantToolGuard } from './guards/assistant-tool.guard';

@Module({
  imports: [
    forwardRef(() => ProfileModule),
    MessagesModule,
    forwardRef(() => WhatsappModule),
  ],
  providers: [
    AssistantMainService,
    AssistantWorkflowService,
    AssistantConnectionService,
    AssistantToolGuard,
  ],
  exports: [AssistantMainService],
})
export class AssistantModule {}
