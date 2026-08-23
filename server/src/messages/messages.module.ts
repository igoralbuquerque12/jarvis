import { Module } from '@nestjs/common';
import { MessagesService } from './services/messages.service';

@Module({
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
