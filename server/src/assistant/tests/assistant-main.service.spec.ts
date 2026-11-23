import { MessageContentType, MessageType } from '@prisma/client';

import type { MessagesService } from '../../messages/services/messages.service';
import type { ProfileService } from '../../profile/services/profile.service';
import {
  ASSISTANT_AUDIO_UNREADABLE_REPLY,
  ASSISTANT_FALLBACK_REPLY,
} from '../constants/assistant-message.constant';
import type { IncomingMessageDto } from '../dto/receive-message.dto';
import { AssistantAudioError } from '../errors/assistant-audio.error';
import type { AssistantAudioService } from '../services/assistant-audio.service';
import type { AssistantConnectionService } from '../services/assistant-connection.service';
import { AssistantMainService } from '../services/assistant-main.service';
import type { AssistantMessageService } from '../services/assistant-message.service';
import type { AssistantRunService } from '../services/assistant-run.service';
import type { AssistantWorkflowService } from '../services/assistant-workflow.service';

describe('AssistantMainService.receiveMessage', () => {
  const profile = {
    id: '0f0c2b3e-8f7a-4d0e-9a3b-2c1d4e5f6a7b',
    jid: '5511999999999@s.whatsapp.net',
  };
  const runId = '1a2b3c4d-1111-4b2c-8d3e-4f5a6b7c8d9e';
  const incoming = {
    from: profile.jid,
    messageId: 'WA-1',
    text: 'gastei 50 no mercado',
  } as IncomingMessageDto;

  function makeService() {
    const profileService = { findOne: jest.fn().mockResolvedValue(profile) };
    const messagesService = { create: jest.fn().mockResolvedValue({}) };
    const workflow = {
      fetch: jest.fn().mockResolvedValue({ status: 'COMPLETED' }),
    };
    const connection = { connectionAttempt: jest.fn() };
    const runs = {
      start: jest.fn().mockResolvedValue({ id: runId }),
      complete: jest.fn().mockResolvedValue(true),
      fail: jest.fn().mockResolvedValue(true),
    };
    const assistantMessages = {
      hasReplied: jest.fn().mockResolvedValue(true),
      deliver: jest.fn().mockResolvedValue(undefined),
    };
    const audio = { transcribe: jest.fn() };

    const service = new AssistantMainService(
      profileService as unknown as ProfileService,
      messagesService as unknown as MessagesService,
      workflow as unknown as AssistantWorkflowService,
      connection as unknown as AssistantConnectionService,
      runs as unknown as AssistantRunService,
      assistantMessages as unknown as AssistantMessageService,
      audio as unknown as AssistantAudioService,
    );

    return {
      service,
      profileService,
      messagesService,
      workflow,
      connection,
      runs,
      assistantMessages,
      audio,
    };
  }

  it('does not open a run for a sender without a profile', async () => {
    const { service, profileService, connection, runs, workflow } =
      makeService();
    profileService.findOne.mockResolvedValue(null);
    connection.connectionAttempt.mockResolvedValue(true);

    await service.receiveMessage(incoming);

    expect(connection.connectionAttempt).toHaveBeenCalledWith(
      incoming.text,
      incoming.from,
    );
    expect(runs.start).not.toHaveBeenCalled();
    expect(workflow.fetch).not.toHaveBeenCalled();
  });

  it('skips a redelivered message without calling n8n', async () => {
    const { service, runs, workflow, messagesService, assistantMessages } =
      makeService();
    runs.start.mockResolvedValue(null);

    await expect(service.receiveMessage(incoming)).resolves.toMatchObject({
      ok: true,
      duplicate: true,
    });

    expect(runs.start).toHaveBeenCalledWith(profile.id, 'WA-1');
    expect(messagesService.create).not.toHaveBeenCalled();
    expect(workflow.fetch).not.toHaveBeenCalled();
    expect(assistantMessages.deliver).not.toHaveBeenCalled();
  });

  it('sends only the runId to n8n and completes the run without sending anything itself', async () => {
    const { service, runs, workflow, messagesService, assistantMessages } =
      makeService();

    await expect(service.receiveMessage(incoming)).resolves.toEqual({
      ok: true,
      runId,
    });

    expect(workflow.fetch).toHaveBeenCalledWith({ runId });
    expect(messagesService.create).toHaveBeenCalledTimes(1);
    expect(messagesService.create).toHaveBeenCalledWith({
      userId: profile.id,
      content: incoming.text,
      type: MessageType.user,
      contentType: MessageContentType.TEXT,
      runId,
    });
    expect(assistantMessages.deliver).not.toHaveBeenCalled();
    expect(runs.complete).toHaveBeenCalledWith(runId);
    expect(runs.fail).not.toHaveBeenCalled();
  });

  it('sends the fallback reply when the run finishes without any message', async () => {
    const { service, runs, assistantMessages } = makeService();
    assistantMessages.hasReplied.mockResolvedValue(false);

    await expect(service.receiveMessage(incoming)).resolves.toEqual({
      ok: true,
      runId,
    });

    expect(assistantMessages.deliver).toHaveBeenCalledWith(
      profile,
      runId,
      ASSISTANT_FALLBACK_REPLY,
    );
    expect(runs.complete).toHaveBeenCalledWith(runId);
  });

  it('transcribes an audio after opening the run and stores it as AUDIO', async () => {
    const { service, audio, messagesService, workflow, runs } = makeService();
    const incomingAudio = {
      mimetype: 'audio/ogg; codecs=opus',
      seconds: 4,
      download: jest.fn(),
    };
    audio.transcribe.mockResolvedValue('me lembra de pagar o aluguel amanhã');

    await service.receiveMessage({
      ...incoming,
      text: undefined,
      audio: incomingAudio,
    });

    expect(audio.transcribe).toHaveBeenCalledWith(incomingAudio);
    expect(runs.start.mock.invocationCallOrder[0]).toBeLessThan(
      audio.transcribe.mock.invocationCallOrder[0],
    );
    expect(messagesService.create).toHaveBeenCalledWith({
      userId: profile.id,
      content: 'me lembra de pagar o aluguel amanhã',
      type: MessageType.user,
      contentType: MessageContentType.AUDIO,
      runId,
    });
    expect(workflow.fetch).toHaveBeenCalledWith({ runId });
  });

  it('fails the run and tells the user when the audio cannot be transcribed', async () => {
    const {
      service,
      audio,
      runs,
      workflow,
      messagesService,
      assistantMessages,
    } = makeService();
    assistantMessages.hasReplied.mockResolvedValue(false);
    audio.transcribe.mockRejectedValue(
      new AssistantAudioError(
        'Audio transcription failed: groq 500',
        ASSISTANT_AUDIO_UNREADABLE_REPLY,
      ),
    );

    await expect(
      service.receiveMessage({
        ...incoming,
        text: undefined,
        audio: { mimetype: 'audio/ogg', seconds: 3, download: jest.fn() },
      }),
    ).resolves.toEqual({
      ok: false,
      error: 'Audio transcription failed: groq 500',
    });

    expect(messagesService.create).not.toHaveBeenCalled();
    expect(workflow.fetch).not.toHaveBeenCalled();
    expect(runs.fail).toHaveBeenCalledWith(
      runId,
      'Audio transcription failed: groq 500',
    );
    expect(assistantMessages.deliver).toHaveBeenCalledWith(
      profile,
      runId,
      ASSISTANT_AUDIO_UNREADABLE_REPLY,
    );
  });

  it('marks the run FAILED and sends the fallback reply when n8n fails before any message', async () => {
    const { service, runs, workflow, assistantMessages } = makeService();
    assistantMessages.hasReplied.mockResolvedValue(false);
    workflow.fetch.mockRejectedValue(new Error('workflow 502'));

    await expect(service.receiveMessage(incoming)).resolves.toEqual({
      ok: false,
      error: 'workflow 502',
    });

    expect(runs.fail).toHaveBeenCalledWith(runId, 'workflow 502');
    expect(runs.complete).not.toHaveBeenCalled();
    expect(assistantMessages.deliver).toHaveBeenCalledWith(
      profile,
      runId,
      ASSISTANT_FALLBACK_REPLY,
    );
  });

  it('does not apologise when n8n fails after the assistant already replied', async () => {
    const { service, runs, workflow, assistantMessages } = makeService();
    workflow.fetch.mockRejectedValue(new Error('workflow 502'));

    await service.receiveMessage(incoming);

    expect(runs.fail).toHaveBeenCalledWith(runId, 'workflow 502');
    expect(assistantMessages.deliver).not.toHaveBeenCalled();
  });

  it('still reports the original failure when the fallback reply cannot be sent', async () => {
    const { service, workflow, assistantMessages } = makeService();
    assistantMessages.hasReplied.mockResolvedValue(false);
    assistantMessages.deliver.mockRejectedValue(new Error('whatsapp down'));
    workflow.fetch.mockRejectedValue(new Error('workflow 502'));

    await expect(service.receiveMessage(incoming)).resolves.toEqual({
      ok: false,
      error: 'workflow 502',
    });
  });

  it('does not try to fail a run that was never opened', async () => {
    const { service, runs, assistantMessages } = makeService();
    runs.start.mockRejectedValue(new Error('db down'));

    await service.receiveMessage(incoming);

    expect(runs.fail).not.toHaveBeenCalled();
    expect(assistantMessages.deliver).not.toHaveBeenCalled();
  });
});
