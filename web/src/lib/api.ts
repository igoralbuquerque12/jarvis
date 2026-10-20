import { apiBaseUrl } from './config';

export class ApiError extends Error {
  readonly status: number;
  /** Machine-readable code from the body, e.g. "plan_required". */
  readonly code: string | null;

  constructor(status: number, message: string, code: string | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/** The route exists but the profile's plan does not include it (403). */
export function isPlanRequiredError(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'plan_required';
}

function extractErrorCode(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || !('code' in body)) {
    return null;
  }

  const { code } = body as { code?: unknown };
  return typeof code === 'string' ? code : null;
}

function extractErrorMessage(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || !('message' in body)) {
    return null;
  }

  const { message } = body as { message?: unknown };

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  if (Array.isArray(message) && message.length > 0) {
    return message.filter((item) => typeof item === 'string').join(' ');
  }

  return null;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      extractErrorMessage(body) ?? `Falha na requisição (${response.status}).`,
      extractErrorCode(body),
    );
  }

  return body as T;
}
