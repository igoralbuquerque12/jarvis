import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import { OpenaiProvider } from './openai.provider';
import { OPENAI_MODEL } from './openai.constant';

type RequestBody = {
  model: string;
  response_format: {
    type: string;
    json_schema: { strict: boolean; schema: Record<string, unknown> };
  };
  messages: { content: string }[];
};

describe('OpenaiProvider', () => {
  const schema = z.object({ name: z.string() });

  function makeProvider(config: Record<string, string> = {}) {
    const configService = {
      get: jest.fn(
        (key: string, fallback?: unknown) => config[key] ?? fallback,
      ),
    } as unknown as ConfigService;

    return new OpenaiProvider(configService);
  }

  it('throws when OPENAI_API_KEY is missing', () => {
    expect(() => makeProvider().assertConfigured()).toThrow(
      'OPENAI_API_KEY environment variable is required.',
    );
  });

  it('requests a strict json_schema response and validates the output', async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: '{"name":"Ana"}' } }],
        }),
      ),
    );
    global.fetch = fetchMock;

    const result = await makeProvider({
      OPENAI_API_KEY: 'sk-test',
    }).extract({ content: 'texto', instructions: 'extraia', schema });

    expect(result).toEqual({ name: 'Ana' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as RequestBody;

    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    expect(body.model).toBe(OPENAI_MODEL);
    expect(body.response_format.type).toBe('json_schema');
    expect(body.response_format.json_schema.strict).toBe(true);
    expect(body.response_format.json_schema.schema.$schema).toBeUndefined();
    expect(body.messages[1].content).toContain('extraia');
    expect(body.messages[1].content).toContain('texto');
  });
});
