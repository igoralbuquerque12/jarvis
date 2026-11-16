import { AI_EMBEDDING_BATCH_SIZE } from '../constants/ai.constant';
import { EmbeddingProvider } from '../contracts/embedding-provider.contract';
import { AiProviderError } from '../errors/ai-provider.error';
import { EmbeddingService } from './embedding.service';

describe('EmbeddingService', () => {
  function makeService(embed: jest.Mock) {
    const provider = {
      model: 'embed-model',
      assertConfigured: jest.fn(),
      embed,
    } as unknown as EmbeddingProvider;

    return new EmbeddingService(provider);
  }

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('exposes the provider model', () => {
    expect(makeService(jest.fn()).model).toBe('embed-model');
  });

  it('splits the input in batches and keeps the order', async () => {
    const embed = jest.fn(({ texts }: { texts: string[] }) =>
      Promise.resolve(texts.map((text) => [Number(text)])),
    );
    const texts = Array.from(
      { length: AI_EMBEDDING_BATCH_SIZE + 3 },
      (_, index) => String(index),
    );

    const vectors = await makeService(embed).embed({ texts });

    expect(embed).toHaveBeenCalledTimes(2);
    expect(vectors.map(([value]) => value)).toEqual(texts.map(Number));
  });

  it('retries a retryable failure of a batch', async () => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const embed = jest
      .fn()
      .mockRejectedValueOnce(new AiProviderError('rate', true))
      .mockResolvedValue([[1]]);

    const promise = makeService(embed).embed({ texts: ['a'] });
    await jest.advanceTimersByTimeAsync(1000);

    await expect(promise).resolves.toEqual([[1]]);
    expect(embed).toHaveBeenCalledTimes(2);
  });
});
