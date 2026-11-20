import type { TranscriptionProvider } from '../../ai/contracts/transcription-provider.contract';
import {
  ASSISTANT_AUDIO_MAX_BYTES,
  ASSISTANT_AUDIO_MAX_SECONDS,
  ASSISTANT_AUDIO_TOO_LONG_REPLY,
  ASSISTANT_AUDIO_UNREADABLE_REPLY,
} from '../constants/assistant-message.constant';
import { AssistantAudioService } from '../services/assistant-audio.service';

describe('AssistantAudioService.transcribe', () => {
  const mimetype = 'audio/ogg; codecs=opus';

  function makeService() {
    const provider = { transcribe: jest.fn().mockResolvedValue('bom dia') };
    const service = new AssistantAudioService(
      provider as unknown as TranscriptionProvider,
    );

    return { service, provider };
  }

  it('downloads the audio and returns the transcription', async () => {
    const { service, provider } = makeService();
    const data = Buffer.from('opus');
    const download = jest.fn().mockResolvedValue(data);

    await expect(
      service.transcribe({ mimetype, seconds: 3, download }),
    ).resolves.toBe('bom dia');

    expect(provider.transcribe).toHaveBeenCalledWith({ audio: data, mimetype });
  });

  it('refuses a too long audio without downloading it', async () => {
    const { service, provider } = makeService();
    const download = jest.fn();

    await expect(
      service.transcribe({
        mimetype,
        seconds: ASSISTANT_AUDIO_MAX_SECONDS + 1,
        download,
      }),
    ).rejects.toMatchObject({
      name: 'AssistantAudioError',
      userMessage: ASSISTANT_AUDIO_TOO_LONG_REPLY,
    });

    expect(download).not.toHaveBeenCalled();
    expect(provider.transcribe).not.toHaveBeenCalled();
  });

  it('refuses a too large audio without transcribing it', async () => {
    const { service, provider } = makeService();
    const download = jest
      .fn()
      .mockResolvedValue({ length: ASSISTANT_AUDIO_MAX_BYTES + 1 });

    await expect(
      service.transcribe({ mimetype, seconds: 0, download }),
    ).rejects.toMatchObject({ userMessage: ASSISTANT_AUDIO_TOO_LONG_REPLY });

    expect(provider.transcribe).not.toHaveBeenCalled();
  });

  it.each([
    ['the download fails', 'download'],
    ['the provider fails', 'provider'],
  ])('asks the user to resend when %s', async (_label, failing) => {
    const { service, provider } = makeService();
    const download = jest.fn().mockResolvedValue(Buffer.from('opus'));

    if (failing === 'download') {
      download.mockRejectedValue(new Error('media expired'));
    } else {
      provider.transcribe.mockRejectedValue(new Error('groq 500'));
    }

    await expect(
      service.transcribe({ mimetype, seconds: 3, download }),
    ).rejects.toMatchObject({
      name: 'AssistantAudioError',
      userMessage: ASSISTANT_AUDIO_UNREADABLE_REPLY,
    });
  });

  it('treats an empty transcription as unreadable', async () => {
    const { service, provider } = makeService();
    provider.transcribe.mockResolvedValue('');

    await expect(
      service.transcribe({
        mimetype,
        seconds: 2,
        download: jest.fn().mockResolvedValue(Buffer.from('opus')),
      }),
    ).rejects.toMatchObject({ userMessage: ASSISTANT_AUDIO_UNREADABLE_REPLY });
  });
});
