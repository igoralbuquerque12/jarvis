import { forwardRef, Module } from '@nestjs/common';
import { BaileysAuthStore } from './auth/baileys-auth.store';
import { WhatsappAuthCryptoService } from './crypto/whatsapp-auth-crypto.service';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappConnectionService } from './whatsapp-connection.service';
import { WhatsappReceiverService } from './whatsapp-receiver.service';
import { WhatsappSenderService } from './whatsapp-sender.service';
import { WhatsappService } from './whatsapp.service';
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
