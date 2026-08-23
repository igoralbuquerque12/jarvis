import { forwardRef, Module } from '@nestjs/common';
import { BaileysAuthStore } from './auth/baileys-auth.store';
import { WhatsappAuthCryptoService } from './services/whatsapp-auth-crypto.service';
import { WhatsappController } from './controllers/whatsapp.controller';
import { WhatsappConnectionService } from './services/whatsapp-connection.service';
import { WhatsappReceiverService } from './services/whatsapp-receiver.service';
import { WhatsappSenderService } from './services/whatsapp-sender.service';
import { WhatsappService } from './services/whatsapp.service';
import { AssistantModule } from '../assistant/assistant.module';

@Module({
  imports: [forwardRef(() => AssistantModule)],
  controllers: [WhatsappController],
  providers: [
    BaileysAuthStore,
    WhatsappAuthCryptoService,
    WhatsappReceiverService,
    WhatsappConnectionService,
    WhatsappSenderService,
    WhatsappService,
  ],
  exports: [WhatsappService, WhatsappSenderService],
})
export class WhatsappModule {}
