import { Module } from '@nestjs/common';
import { OpenaiProvider } from './openai.provider';

@Module({
  providers: [OpenaiProvider],
  exports: [OpenaiProvider],
})
export class OpenaiModule {}
