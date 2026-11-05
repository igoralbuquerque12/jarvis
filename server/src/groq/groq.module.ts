import { Module } from '@nestjs/common';
import { GroqProvider } from './groq.provider';

@Module({
  providers: [GroqProvider],
  exports: [GroqProvider],
})
export class GroqModule {}
