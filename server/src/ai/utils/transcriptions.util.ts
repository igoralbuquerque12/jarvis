import { postToProvider } from './provider-http.util';

export type TranscriptionRequest = {
  provider: string;
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
  model: string;
  /** ISO-639-1 hint; improves accuracy and latency. */
  language: string;
  audio: Buffer;
  mimetype: string;
};

type TranscriptionResponse = { text?: string };

/** Extension the vendor uses to sniff the container, keyed by MIME subtype. */
const EXTENSION_BY_SUBTYPE: Record<string, string> = {
  ogg: 'ogg',
  opus: 'opus',
  mpeg: 'mp3',
  mp3: 'mp3',
  mp4: 'm4a',
  'x-m4a': 'm4a',
  aac: 'm4a',
  wav: 'wav',
  'x-wav': 'wav',
  webm: 'webm',
  flac: 'flac',
};

/** `audio/ogg; codecs=opus` → `audio.ogg`. Unknown types fall back to ogg. */
export function audioFileName(mimetype: string): string {
  const subtype = mimetype.split(';')[0].trim().toLowerCase().split('/')[1];

  return `audio.${EXTENSION_BY_SUBTYPE[subtype] ?? 'ogg'}`;
}

/**
 * Calls an OpenAI-compatible `/audio/transcriptions` endpoint (multipart) and
 * returns the trimmed text. Failures surface as `AiProviderError`.
 */
export async function requestTranscription(
  request: TranscriptionRequest,
): Promise<string> {
  const type = request.mimetype.split(';')[0].trim() || 'audio/ogg';
  const form = new FormData();

  form.append(
    'file',
    new Blob([new Uint8Array(request.audio)], { type }),
    audioFileName(request.mimetype),
  );
  form.append('model', request.model);
  form.append('language', request.language);
  form.append('response_format', 'json');
  form.append('temperature', '0');

  const payload = await postToProvider<TranscriptionResponse>({
    provider: request.provider,
    baseUrl: request.baseUrl,
    path: '/audio/transcriptions',
    apiKey: request.apiKey,
    timeoutMs: request.timeoutMs,
    body: form,
  });

  return (payload.text ?? '').trim();
}
