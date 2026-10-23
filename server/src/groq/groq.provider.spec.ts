import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import { GroqProvider } from './groq.provider';
import { GROQ_MODEL } from './groq.constant';

type RequestBody = {
  model: string;
  response_format: { type: string };
  messages: { content: string }[];
};

describe('GroqProvider', () => {
  const schema = z.object({ name: z.string() });

  function makeProvider(config: Record<string, string> = {}) {
    const configService = {
      get: jest.fn(
        (key: string, fallback?: unknown) => config[key] ?? fallback,
      ),
    } as unknown as ConfigService;

    return new GroqProvider(configService);
  }

  it('throws when GROQ_API_KEY is missing', () => {
    expect(() => makeProvider().assertConfigured()).toThrow(
      'GROQ_API_KEY environment variable is required.',
    );
  });

  it('requests json_object with the schema in the prompt and validates the output', async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: '{"name":"Ana"}' } }],
        }),
      ),
    );
    global.fetch = fetchMock;

    const result = await makeProvider({
      GROQ_API_KEY: 'gsk-test',
    }).extract({ content: 'texto', instructions: 'extraia', schema });

    expect(result).toEqual({ name: 'Ana' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as RequestBody;

    expect(url).toBe('https://api.groq.com/openai/v1/chat/completions');
    expect(body.model).toBe(GROQ_MODEL);
    expect(body.response_format).toEqual({ type: 'json_object' });
    expect(body.messages[0].content).toContain('"name"');
    expect(body.messages[1].content).toContain('texto');
  });
});
