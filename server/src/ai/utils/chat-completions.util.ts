import type { ZodType } from 'zod';
import { AiProviderError } from '../errors/ai-provider.error';

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

const RETRYABLE_STATUSES = new Set([408, 409, 425, 429]);

/**
 * Calls an OpenAI-compatible `/chat/completions` endpoint and returns the
 * assistant message content. Every failure is mapped to `AiProviderError`
 * with `retryable` set, so callers never see vendor-specific errors.
 */
export async function requestChatCompletion(
  request: ChatCompletionRequest,
): Promise<string> {
  const url = `${request.baseUrl.replace(/\/+$/, '')}/chat/completions`;

  let response: Response;

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${request.apiKey}`,
      },
      body: JSON.stringify(request.body),
      signal: AbortSignal.timeout(request.timeoutMs),
    });
  } catch (error) {
    // Network failures and timeouts are transient.
    throw new AiProviderError(
      `${request.provider} request failed: ${(error as Error).message}`,
      true,
      undefined,
      { cause: error },
    );
  }

  if (!response.ok) {
    throw await toProviderError(request.provider, response);
  }

  const payload = (await response.json()) as ChatCompletionResponse;
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

async function toProviderError(
  provider: string,
  response: Response,
): Promise<AiProviderError> {
  const detail = await readDetail(response);
  const retryable =
    response.status >= 500 || RETRYABLE_STATUSES.has(response.status);

  return new AiProviderError(
    `${provider} request failed: ${response.status} ${response.statusText}${
      detail ? ` (${detail})` : ''
    }`,
    retryable,
    parseRetryAfter(response.headers.get('retry-after')),
  );
}

async function readDetail(response: Response): Promise<string | undefined> {
  try {
    const payload = (await response.json()) as {
      error?: { message?: string } | string;
    };

    return typeof payload.error === 'string'
      ? payload.error
      : payload.error?.message;
  } catch {
    return undefined;
  }
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const seconds = Number(value);

  if (Number.isFinite(seconds)) {
    return Math.max(0, seconds * 1000);
  }

  const date = Date.parse(value);

  return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now());
}
