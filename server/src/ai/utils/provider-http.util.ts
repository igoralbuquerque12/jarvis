import { AiProviderError } from '../errors/ai-provider.error';

export type ProviderPostRequest = {
  provider: string;
  baseUrl: string;
  /** Path appended to `baseUrl`, e.g. `/chat/completions`. */
  path: string;
  apiKey: string;
  timeoutMs: number;
  /** JSON payload, or a multipart form (file uploads such as audio). */
  body: Record<string, unknown> | FormData;
};

const RETRYABLE_STATUSES = new Set([408, 409, 425, 429]);

/**
 * POSTs JSON (or multipart, when `body` is a `FormData`) to an
 * OpenAI-compatible endpoint and returns the parsed body.
 * Every failure is mapped to `AiProviderError` with `retryable` set, so
 * callers never see vendor-specific errors.
 */
export async function postToProvider<T>(
  request: ProviderPostRequest,
): Promise<T> {
  const url = `${request.baseUrl.replace(/\/+$/, '')}${request.path}`;

  // fetch sets the multipart boundary itself, so no Content-Type for forms.
  const form = request.body instanceof FormData ? request.body : null;

  let response: Response;

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(!form && { 'Content-Type': 'application/json' }),
        Authorization: `Bearer ${request.apiKey}`,
      },
      body: form ?? JSON.stringify(request.body),
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

  return (await response.json()) as T;
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
