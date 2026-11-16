import { AiProviderError } from '../errors/ai-provider.error';
import { requestEmbeddings } from './embeddings.util';

describe('requestEmbeddings', () => {
  const request = {
    provider: 'test',
    baseUrl: 'https://api.test/v1/',
    apiKey: 'secret',
    timeoutMs: 1000,
    model: 'embed-model',
    dimensions: 2,
    input: ['a', 'b'],
  };

  function mockFetch(body: unknown, init?: ResponseInit) {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(body), init));
    global.fetch = fetchMock;

    return fetchMock;
  }

  it('posts to /embeddings and returns the vectors in input order', async () => {
    const fetchMock = mockFetch({
      data: [
        { index: 1, embedding: [3, 4] },
        { index: 0, embedding: [1, 2] },
      ],
    });

    await expect(requestEmbeddings(request)).resolves.toEqual([
      [1, 2],
      [3, 4],
    ]);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.test/v1/embeddings');
    expect(JSON.parse(init.body as string)).toEqual({
      model: 'embed-model',
      dimensions: 2,
      input: ['a', 'b'],
      encoding_format: 'float',
    });
  });

  it('rejects a response with missing or wrongly sized vectors as retryable', async () => {
    mockFetch({ data: [{ index: 0, embedding: [1, 2, 3] }] });

    await expect(requestEmbeddings(request)).rejects.toMatchObject({
      retryable: true,
    });
  });

  it('maps HTTP errors to AiProviderError', async () => {
    mockFetch({ error: { message: 'bad key' } }, { status: 401 });

    const error = (await requestEmbeddings(request).catch(
      (caught: unknown) => caught,
    )) as AiProviderError;

    expect(error).toBeInstanceOf(AiProviderError);
    expect(error.retryable).toBe(false);
    expect(error.message).toContain('bad key');
  });
});
