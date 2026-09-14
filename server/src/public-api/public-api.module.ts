import { Module } from '@nestjs/common';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { PublicApiController } from './controllers/public-api.controller';
import { PublicApiService } from './services/public-api.service';

@Module({
  imports: [ApiKeysModule, WhatsappModule],
  controllers: [PublicApiController],
  providers: [PublicApiService],
})
export class PublicApiModule {}
