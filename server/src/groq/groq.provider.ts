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
import { GROQ_BASE_URL, GROQ_MODEL } from './groq.constant';

@Injectable()
export class GroqProvider implements AiProvider {
  constructor(private readonly configService: ConfigService) {}

  assertConfigured() {
    this.apiKey();
  }

  async extract<T>({
    content,
    instructions,
    schema,
  }: AiExtractRequest<T>): Promise<T> {
    // `json_object` works on every Groq model, while `json_schema` only on a
    // few. So the schema goes in the prompt and Zod enforces it afterwards.
    const jsonSchema = JSON.stringify(z.toJSONSchema(schema));

    const output = await requestChatCompletion({
      provider: 'groq',
      baseUrl: GROQ_BASE_URL,
      apiKey: this.apiKey(),
      timeoutMs: AI_TIMEOUT_MS,
      body: {
        model: GROQ_MODEL,
        temperature: 0,
        messages: [
          {
            role: 'system',
            content: `${AI_EXTRACTION_SYSTEM_PROMPT}\n\nJSON Schema da resposta:\n${jsonSchema}`,
          },
          { role: 'user', content: `${instructions}\n\n---\n\n${content}` },
        ],
        response_format: { type: 'json_object' },
      },
    });

    return parseExtraction('groq', output, schema);
  }

  private apiKey(): string {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');

    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is required.');
    }

    return apiKey;
  }
}
