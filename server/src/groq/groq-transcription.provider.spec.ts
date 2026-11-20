import { ConfigService } from '@nestjs/config';
import { audioFileName } from '../ai/utils/transcriptions.util';
import { GroqTranscriptionProvider } from './groq-transcription.provider';
import { GROQ_TRANSCRIPTION_MODEL } from './groq.constant';

describe('GroqTranscriptionProvider', () => {
  function makeProvider(config: Record<string, string> = {}) {
    const configService = {
      get: jest.fn(
        (key: string, fallback?: unknown) => config[key] ?? fallback,
      ),
    } as unknown as ConfigService;

    return new GroqTranscriptionProvider(configService);
  }

  it('throws when GROQ_API_KEY is missing', () => {
    expect(() => makeProvider().assertConfigured()).toThrow(
      'GROQ_API_KEY environment variable is required (audio transcription).',
    );
  });

  it('uploads the audio as multipart to Whisper and returns the trimmed text', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ text: ' bom dia ' })));
    global.fetch = fetchMock;

    const text = await makeProvider({ GROQ_API_KEY: 'gsk-test' }).transcribe({
      audio: Buffer.from('opus-bytes'),
      mimetype: 'audio/ogg; codecs=opus',
    });

    expect(text).toBe('bom dia');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const form = init.body as FormData;
    const file = form.get('file') as File;

    expect(url).toBe('https://api.groq.com/openai/v1/audio/transcriptions');
    expect(init.headers).toEqual({ Authorization: 'Bearer gsk-test' });
    expect(form.get('model')).toBe(GROQ_TRANSCRIPTION_MODEL);
    expect(form.get('language')).toBe('pt');
    expect(file.name).toBe('audio.ogg');
    expect(file.type).toBe('audio/ogg');
    expect(Buffer.from(await file.arrayBuffer()).toString()).toBe('opus-bytes');
  });

  it('surfaces provider failures as AiProviderError', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'rate limited' } }), {
        status: 429,
      }),
    );

    await expect(
      makeProvider({ GROQ_API_KEY: 'gsk-test' }).transcribe({
        audio: Buffer.from('x'),
        mimetype: 'audio/ogg',
      }),
    ).rejects.toMatchObject({ name: 'AiProviderError', retryable: true });
  });
});

describe('audioFileName', () => {
  it.each([
    ['audio/ogg; codecs=opus', 'audio.ogg'],
    ['audio/mpeg', 'audio.mp3'],
    ['audio/mp4', 'audio.m4a'],
    ['audio/unknown', 'audio.ogg'],
    ['', 'audio.ogg'],
  ])('maps %s to %s', (mimetype, expected) => {
    expect(audioFileName(mimetype)).toBe(expected);
  });
});
