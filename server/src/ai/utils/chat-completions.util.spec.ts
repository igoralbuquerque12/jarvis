import { z } from 'zod';
import { AiProviderError } from '../errors/ai-provider.error';
import {
  parseExtraction,
  requestChatCompletion,
} from './chat-completions.util';

describe('chat-completions util', () => {
  const request = {
    provider: 'test',
    baseUrl: 'https://api.test/v1/',
    apiKey: 'secret',
    timeoutMs: 1000,
    body: { model: 'm' },
  };

  function mockFetch(response: Response | Error) {
    const fetchMock = jest.fn();

    if (response instanceof Error) {
      fetchMock.mockRejectedValue(response);
    } else {
      fetchMock.mockResolvedValue(response);
    }

    global.fetch = fetchMock;

    return fetchMock;
  }

  function jsonResponse(body: unknown, init?: ResponseInit) {
    return new Response(JSON.stringify(body), init);
  }

  describe('requestChatCompletion', () => {
    it('posts to /chat/completions with bearer auth and returns the content', async () => {
      const fetchMock = mockFetch(
        jsonResponse({ choices: [{ message: { content: '{"a":1}' } }] }),
      );

      await expect(requestChatCompletion(request)).resolves.toBe('{"a":1}');

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('https://api.test/v1/chat/completions');
      expect(init.headers).toMatchObject({ Authorization: 'Bearer secret' });
      expect(JSON.parse(init.body as string)).toEqual({ model: 'm' });
    });

    it.each([429, 500, 503])('marks HTTP %i as retryable', async (status) => {
      mockFetch(jsonResponse({ error: { message: 'nope' } }, { status }));

      await expect(requestChatCompletion(request)).rejects.toMatchObject({
        retryable: true,
      });
    });

    it.each([400, 401, 404])(
      'marks HTTP %i as not retryable',
      async (status) => {
        mockFetch(jsonResponse({ error: { message: 'nope' } }, { status }));

        await expect(requestChatCompletion(request)).rejects.toMatchObject({
          retryable: false,
        });
      },
    );

    it('reads Retry-After in seconds', async () => {
      mockFetch(
        jsonResponse({}, { status: 429, headers: { 'retry-after': '2' } }),
      );

      await expect(requestChatCompletion(request)).rejects.toMatchObject({
        retryAfterMs: 2000,
      });
    });

    it('marks network failures as retryable', async () => {
      mockFetch(new TypeError('fetch failed'));

      await expect(requestChatCompletion(request)).rejects.toMatchObject({
        retryable: true,
      });
    });

    it('treats an empty completion as retryable', async () => {
      mockFetch(jsonResponse({ choices: [{ message: { content: '' } }] }));

      await expect(requestChatCompletion(request)).rejects.toMatchObject({
        retryable: true,
      });
    });
  });

  describe('parseExtraction', () => {
    const schema = z.object({ name: z.string() });

    it('returns the validated data', () => {
      expect(parseExtraction('test', '{"name":"x"}', schema)).toEqual({
        name: 'x',
      });
    });

    it('throws a retryable error on invalid JSON', () => {
      expect(() => parseExtraction('test', 'not json', schema)).toThrow(
        AiProviderError,
      );
    });

    it('throws a retryable error when the schema does not match', () => {
      expect.assertions(2);

      try {
        parseExtraction('test', '{"name":1}', schema);
      } catch (error) {
        expect(error).toBeInstanceOf(AiProviderError);
        expect((error as AiProviderError).retryable).toBe(true);
      }
    });
  });
});
