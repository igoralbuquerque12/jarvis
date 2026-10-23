import { z } from 'zod';
import { AI_MAX_ATTEMPTS, AI_RETRY_BASE_MS } from '../constants/ai.constant';
import { AiProvider } from '../contracts/ai-provider.contract';
import { AiProviderError } from '../errors/ai-provider.error';
import { AiService } from './ai.service';

describe('AiService', () => {
  const schema = z.object({ name: z.string() });
  const request = { content: 'c', instructions: 'i', schema };

  function makeService(extract: jest.Mock) {
    const provider = {
      assertConfigured: jest.fn(),
      extract,
    } as unknown as AiProvider;

    return { provider, service: new AiService(provider) };
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('returns the provider result without retrying on success', async () => {
    const extract = jest.fn().mockResolvedValue({ name: 'ok' });
    const { service } = makeService(extract);

    await expect(service.extract(request)).resolves.toEqual({ name: 'ok' });
    expect(extract).toHaveBeenCalledTimes(1);
  });

  it('retries retryable errors with exponential backoff', async () => {
    const extract = jest
      .fn()
      .mockRejectedValueOnce(new AiProviderError('boom', true))
      .mockRejectedValueOnce(new AiProviderError('boom', true))
      .mockResolvedValue({ name: 'ok' });
    const { service } = makeService(extract);

    const promise = service.extract(request);

    await jest.advanceTimersByTimeAsync(AI_RETRY_BASE_MS);
    expect(extract).toHaveBeenCalledTimes(2);

    await jest.advanceTimersByTimeAsync(AI_RETRY_BASE_MS * 2);
    await expect(promise).resolves.toEqual({ name: 'ok' });
    expect(extract).toHaveBeenCalledTimes(3);
  });

  it('honors retryAfterMs when it is longer than the backoff', async () => {
    const extract = jest
      .fn()
      .mockRejectedValueOnce(new AiProviderError('rate', true, 5000))
      .mockResolvedValue({ name: 'ok' });
    const { service } = makeService(extract);

    const promise = service.extract(request);

    await jest.advanceTimersByTimeAsync(4999);
    expect(extract).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1);
    await expect(promise).resolves.toEqual({ name: 'ok' });
  });

  it('does not retry non-retryable errors', async () => {
    const error = new AiProviderError('unauthorized', false);
    const extract = jest.fn().mockRejectedValue(error);
    const { service } = makeService(extract);

    await expect(service.extract(request)).rejects.toBe(error);
    expect(extract).toHaveBeenCalledTimes(1);
  });

  it('does not retry errors that are not AiProviderError', async () => {
    const extract = jest.fn().mockRejectedValue(new Error('bug'));
    const { service } = makeService(extract);

    await expect(service.extract(request)).rejects.toThrow('bug');
    expect(extract).toHaveBeenCalledTimes(1);
  });

  it('gives up after AI_MAX_ATTEMPTS and throws the last error', async () => {
    const error = new AiProviderError('still down', true);
    const extract = jest.fn().mockRejectedValue(error);
    const { service } = makeService(extract);

    const assertion = expect(service.extract(request)).rejects.toBe(error);

    await jest.advanceTimersByTimeAsync(
      AI_RETRY_BASE_MS * 2 ** AI_MAX_ATTEMPTS,
    );
    await assertion;
    expect(extract).toHaveBeenCalledTimes(AI_MAX_ATTEMPTS);
  });

  it('fails fast on boot when the provider is not configured', () => {
    const extract = jest.fn();
    const { service, provider } = makeService(extract);
    (provider.assertConfigured as jest.Mock).mockImplementation(() => {
      throw new Error('OPENAI_API_KEY environment variable is required.');
    });

    expect(() => service.onModuleInit()).toThrow(
      'OPENAI_API_KEY environment variable is required.',
    );
  });
});
