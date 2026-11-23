import { Module } from '@nestjs/common';
import { GroqTranscriptionProvider } from './groq-transcription.provider';
import { GroqProvider } from './groq.provider';

@Module({
  providers: [GroqProvider, GroqTranscriptionProvider],
  exports: [GroqProvider, GroqTranscriptionProvider],
})
export class GroqModule {}
