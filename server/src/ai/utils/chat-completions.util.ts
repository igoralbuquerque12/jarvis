import type { ZodType } from 'zod';
import { AiProviderError } from '../errors/ai-provider.error';
import { postToProvider } from './provider-http.util';

export type ChatCompletionRequest = {
  provider: string;
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
  body: Record<string, unknown>;
};

type ChatCompletionResponse = {
  choices?: { message?: { content?: string | null } }[];
};

/**
 * Calls an OpenAI-compatible `/chat/completions` endpoint and returns the
 * assistant message content. Failures surface as `AiProviderError`.
 */
export async function requestChatCompletion(
  request: ChatCompletionRequest,
): Promise<string> {
  const payload = await postToProvider<ChatCompletionResponse>({
    ...request,
    path: '/chat/completions',
  });
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new AiProviderError(
      `${request.provider} returned an empty completion.`,
      true,
    );
  }

  return content;
}

/**
 * Parses the model output as JSON and validates it against the schema.
 * An invalid output is retryable: LLMs are not deterministic.
 */
export function parseExtraction<T>(
  provider: string,
  content: string,
  schema: ZodType<T>,
): T {
  let json: unknown;

  try {
    json = JSON.parse(content);
  } catch (error) {
    throw new AiProviderError(
      `${provider} returned invalid JSON.`,
      true,
      undefined,
      { cause: error },
    );
  }

  const result = schema.safeParse(json);

  if (!result.success) {
    throw new AiProviderError(
      `${provider} output does not match the expected schema: ${result.error.message}`,
      true,
    );
  }

  return result.data;
}
