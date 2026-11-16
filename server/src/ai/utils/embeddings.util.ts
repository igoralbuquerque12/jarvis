import { AiProviderError } from '../errors/ai-provider.error';
import { postToProvider } from './provider-http.util';

export type EmbeddingsRequest = {
  provider: string;
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
  model: string;
  dimensions: number;
  input: string[];
};

type EmbeddingsResponse = {
  data?: { index?: number; embedding?: number[] }[];
};

/**
 * Calls an OpenAI-compatible `/embeddings` endpoint and returns one vector per
 * input, in input order. A response with missing or wrongly sized vectors is
 * an `AiProviderError` (retryable: it is a vendor hiccup, not our input).
 */
export async function requestEmbeddings(
  request: EmbeddingsRequest,
): Promise<number[][]> {
  const payload = await postToProvider<EmbeddingsResponse>({
    provider: request.provider,
    baseUrl: request.baseUrl,
    path: '/embeddings',
    apiKey: request.apiKey,
    timeoutMs: request.timeoutMs,
    body: {
      model: request.model,
      dimensions: request.dimensions,
      input: request.input,
      encoding_format: 'float',
    },
  });

  const items = [...(payload.data ?? [])].sort(
    (a, b) => (a.index ?? 0) - (b.index ?? 0),
  );
  const vectors = items.map((item) => item.embedding);

  if (
    vectors.length !== request.input.length ||
    vectors.some(
      (vector) =>
        !Array.isArray(vector) || vector.length !== request.dimensions,
    )
  ) {
    throw new AiProviderError(
      `${request.provider} returned malformed embeddings.`,
      true,
    );
  }

  return vectors as number[][];
}
