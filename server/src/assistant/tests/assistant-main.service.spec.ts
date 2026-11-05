import { MessageType } from '@prisma/client';

import type { MessagesService } from '../../messages/services/messages.service';
import type { ProfileService } from '../../profile/services/profile.service';
import type { WhatsappSenderService } from '../../whatsapp/services/whatsapp-sender.service';
import type { IncomingMessageDto } from '../dto/receive-message.dto';
import type { AssistantConnectionService } from '../services/assistant-connection.service';
import { AssistantMainService } from '../services/assistant-main.service';
import type { AssistantRunService } from '../services/assistant-run.service';
import type { AssistantWorkflowService } from '../services/assistant-workflow.service';

describe('AssistantMainService.receiveMessage', () => {
  const profile = { id: '0f0c2b3e-8f7a-4d0e-9a3b-2c1d4e5f6a7b' };
  const runId = '1a2b3c4d-1111-4b2c-8d3e-4f5a6b7c8d9e';
  const incoming = {
    from: '5511999999999@s.whatsapp.net',
    messageId: 'WA-1',
    text: 'gastei 50 no mercado',
  } as IncomingMessageDto;

  function makeService() {
    const profileService = { findOne: jest.fn().mockResolvedValue(profile) };
    const messagesService = { create: jest.fn().mockResolvedValue({}) };
    const workflow = {
      fetch: jest.fn().mockResolvedValue({ response: 'Anotado.' }),
    };
    const sender = { sendMessage: jest.fn().mockResolvedValue(undefined) };
    const connection = { connectionAttempt: jest.fn() };
    const runs = {
      start: jest.fn().mockResolvedValue({ id: runId }),
      complete: jest.fn().mockResolvedValue({}),
      fail: jest.fn().mockResolvedValue({}),
    };

    const service = new AssistantMainService(
      profileService as unknown as ProfileService,
      messagesService as unknown as MessagesService,
      workflow as unknown as AssistantWorkflowService,
      sender as unknown as WhatsappSenderService,
      connection as unknown as AssistantConnectionService,
      runs as unknown as AssistantRunService,
    );

    return {
      service,
      profileService,
      messagesService,
      workflow,
      sender,
      connection,
      runs,
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
    const { service, runs, workflow, messagesService, sender } = makeService();
    runs.start.mockResolvedValue(null);

    await expect(service.receiveMessage(incoming)).resolves.toMatchObject({
      ok: true,
      duplicate: true,
    });

    expect(runs.start).toHaveBeenCalledWith(profile.id, 'WA-1');
    expect(messagesService.create).not.toHaveBeenCalled();
    expect(workflow.fetch).not.toHaveBeenCalled();
    expect(sender.sendMessage).not.toHaveBeenCalled();
  });

  it('sends only the runId to n8n and completes the run', async () => {
    const { service, runs, workflow, messagesService, sender } = makeService();

    await expect(service.receiveMessage(incoming)).resolves.toEqual({
      ok: true,
      runId,
    });

    expect(workflow.fetch).toHaveBeenCalledWith({ runId });
    expect(messagesService.create).toHaveBeenNthCalledWith(1, {
      userId: profile.id,
      content: incoming.text,
      type: MessageType.user,
      runId,
    });
    expect(messagesService.create).toHaveBeenNthCalledWith(2, {
      userId: profile.id,
      content: 'Anotado.',
      type: MessageType.AI,
      runId,
    });
    expect(sender.sendMessage).toHaveBeenCalledWith(incoming.from, 'Anotado.');
    expect(runs.complete).toHaveBeenCalledWith(runId);
    expect(runs.fail).not.toHaveBeenCalled();
  });

  it('marks the run FAILED with the error when n8n fails', async () => {
    const { service, runs, workflow, sender } = makeService();
    workflow.fetch.mockRejectedValue(new Error('workflow 502'));

    await expect(service.receiveMessage(incoming)).resolves.toEqual({
      ok: false,
      error: 'workflow 502',
    });

    expect(runs.fail).toHaveBeenCalledWith(runId, 'workflow 502');
    expect(runs.complete).not.toHaveBeenCalled();
    expect(sender.sendMessage).not.toHaveBeenCalled();
  });

  it('does not try to fail a run that was never opened', async () => {
    const { service, runs } = makeService();
    runs.start.mockRejectedValue(new Error('db down'));

    await service.receiveMessage(incoming);

    expect(runs.fail).not.toHaveBeenCalled();
  });
});
