import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type SecuroRequestOptions = {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  token?: string;
  workspaceId?: string;
  body?: unknown;
  form?: Record<string, string>;
  query?: Record<string, string | number | undefined>;
};

@Injectable()
export class SecuroApiService {
  constructor(private readonly configService: ConfigService) {}

  async request<T = unknown>(options: SecuroRequestOptions): Promise<T> {
    const baseUrl = this.configService.get<string>('SECURO_API_URL');

    if (!baseUrl) {
      throw new Error('SECURO_API_URL environment variable is required.');
    }

    const url = new URL(options.path, baseUrl);

    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }

    const headers: Record<string, string> = {};

    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }

    if (options.workspaceId) {
      headers['X-Workspace-Id'] = options.workspaceId;
    }

    let body: string | undefined;

    if (options.form) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      body = new URLSearchParams(options.form).toString();
    } else if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(options.body);
    }

    const response = await fetch(url, {
      method: options.method,
      headers,
      body,
    });

    if (!response.ok) {
      throw await this.toException(response);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  private async toException(response: Response): Promise<Error> {
    const detail = await this.readDetail(response);

    if ([400, 409, 422].includes(response.status)) {
      return new BadRequestException(detail ?? 'Securo rejected the request.');
    }

    if (response.status === 404) {
      return new NotFoundException(detail ?? 'Securo resource not found');
    }

    return new Error(
      `Securo request failed: ${response.status} ${response.statusText}${
        detail ? ` (${detail})` : ''
      }`,
    );
  }

  private async readDetail(response: Response): Promise<string | undefined> {
    try {
      const data: unknown = await response.json();

      if (data && typeof data === 'object' && 'detail' in data) {
        const detail = data.detail;
        return typeof detail === 'string' ? detail : JSON.stringify(detail);
      }
    } catch {
      // Non-JSON error body; fall through to the status-only message.
    }

    return undefined;
  }
}
