import { forwardRef, Module } from '@nestjs/common';

import { AssistantMainService } from './services/assistant-main.service';
import { ProfileModule } from '../profile/profile.module';
import { MessagesModule } from '../messages/messages.module';
import { AssistantWorkflowService } from './services/assistant-workflow.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [ProfileModule, MessagesModule, forwardRef(() => WhatsappModule)],
  providers: [AssistantMainService, AssistantWorkflowService],
  exports: [AssistantMainService],
})
export class AssistantModule {}
