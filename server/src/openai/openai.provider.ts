import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import {
  AI_TIMEOUT_MS,
  AI_EXTRACTION_SYSTEM_PROMPT,
} from '../ai/constants/ai.constant';
import {
  AiExtractRequest,
  AiProvider,
} from '../ai/contracts/ai-provider.contract';
import {
  parseExtraction,
  requestChatCompletion,
} from '../ai/utils/chat-completions.util';
import { OPENAI_BASE_URL, OPENAI_MODEL } from './openai.constant';

@Injectable()
export class OpenaiProvider implements AiProvider {
  constructor(private readonly configService: ConfigService) {}

  assertConfigured() {
    this.apiKey();
  }

  async extract<T>({
    content,
    instructions,
    schema,
  }: AiExtractRequest<T>): Promise<T> {
    // OpenAI strict mode rejects `$schema`; it also requires every property to
    // be required, so schemas should use `.nullable()` instead of `.optional()`.
    const jsonSchema: Record<string, unknown> = { ...z.toJSONSchema(schema) };
    delete jsonSchema.$schema;

    const output = await requestChatCompletion({
      provider: 'openai',
      baseUrl: OPENAI_BASE_URL,
      apiKey: this.apiKey(),
      timeoutMs: AI_TIMEOUT_MS,
      body: {
        model: OPENAI_MODEL,
        temperature: 0,
        messages: [
          { role: 'system', content: AI_EXTRACTION_SYSTEM_PROMPT },
          { role: 'user', content: `${instructions}\n\n---\n\n${content}` },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'extraction', strict: true, schema: jsonSchema },
        },
      },
    });

    return parseExtraction('openai', output, schema);
  }

  private apiKey(): string {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required.');
    }

    return apiKey;
  }
}
