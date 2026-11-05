import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GroqModule } from '../groq/groq.module';
import { GroqProvider } from '../groq/groq.provider';
import { OpenaiModule } from '../openai/openai.module';
import { OpenaiProvider } from '../openai/openai.provider';
import {
  AI_BASE_PROVIDER,
  AI_DEFAULT_PROVIDER,
  AI_PROVIDER_NAMES,
  AiProviderName,
} from './constants/ai.constant';
import { AiProvider } from './contracts/ai-provider.contract';
import { AiService } from './services/ai.service';

@Module({
  imports: [OpenaiModule, GroqModule],
  providers: [
    {
      provide: AI_BASE_PROVIDER,
      inject: [ConfigService, OpenaiProvider, GroqProvider],
      useFactory: (
        configService: ConfigService,
        openai: OpenaiProvider,
        groq: GroqProvider,
      ): AiProvider => {
        const name = configService.get<string>(
          'AI_PROVIDER',
          AI_DEFAULT_PROVIDER,
        );

        if (!AI_PROVIDER_NAMES.includes(name as AiProviderName)) {
          throw new Error(
            `AI_PROVIDER must be one of: ${AI_PROVIDER_NAMES.join(', ')} (got "${name}").`,
          );
        }

        return { openai, groq }[name as AiProviderName];
      },
    },
    AiService,
    { provide: AiProvider, useExisting: AiService },
  ],
  exports: [AiProvider],
})
export class AiModule {}
