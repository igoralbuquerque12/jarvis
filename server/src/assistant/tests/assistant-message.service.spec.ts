import { MessageType } from '@prisma/client';

import type { MessagesService } from '../../messages/services/messages.service';
import type { WhatsappSenderService } from '../../whatsapp/services/whatsapp-sender.service';
import { AssistantMessageService } from '../services/assistant-message.service';
import type { AssistantRunService } from '../services/assistant-run.service';

describe('AssistantMessageService', () => {
  const runId = '1a2b3c4d-1111-4b2c-8d3e-4f5a6b7c8d9e';
  const profile = {
    id: '0f0c2b3e-8f7a-4d0e-9a3b-2c1d4e5f6a7b',
    jid: '5511999999999@s.whatsapp.net',
  };

  function makeService() {
    const runs = { findActive: jest.fn().mockResolvedValue({ profile }) };
    const messages = {
      create: jest.fn().mockResolvedValue({}),
      countAiMessagesOfRun: jest.fn().mockResolvedValue(0),
    };
    const sender = { sendMessage: jest.fn().mockResolvedValue({ sent: true }) };

    const service = new AssistantMessageService(
      runs as unknown as AssistantRunService,
      messages as unknown as MessagesService,
      sender as unknown as WhatsappSenderService,
    );

    return { service, runs, messages, sender };
  }

  it('sends to the WhatsApp of the run profile and records the AI message', async () => {
    const { service, runs, messages, sender } = makeService();

    await expect(service.sendForRun(runId, 'Só um minuto.')).resolves.toEqual({
      sent: true,
    });

    expect(runs.findActive).toHaveBeenCalledWith(runId);
    expect(sender.sendMessage).toHaveBeenCalledWith(
      profile.jid,
      'Só um minuto.',
    );
    expect(messages.create).toHaveBeenCalledWith({
      userId: profile.id,
      content: 'Só um minuto.',
      type: MessageType.AI,
      runId,
    });
  });

  it('accepts several messages in the same run', async () => {
    const { service, sender, messages } = makeService();

    await service.sendForRun(runId, 'Só um minuto.');
    await service.sendForRun(runId, 'Em São Paulo faz 24 °C.');

    expect(sender.sendMessage).toHaveBeenCalledTimes(2);
    expect(messages.create).toHaveBeenCalledTimes(2);
  });

  it('refuses a run that is no longer active', async () => {
    const { service, runs, sender } = makeService();
    const conflict = Object.assign(new Error('Run já finalizada.'), {
      status: 409,
    });
    runs.findActive.mockRejectedValue(conflict);

    await expect(service.sendForRun(runId, 'oi')).rejects.toBe(conflict);
    expect(sender.sendMessage).not.toHaveBeenCalled();
  });

  it('answers 409 when the profile has no WhatsApp linked', async () => {
    const { service, sender, messages } = makeService();

    await expect(
      service.deliver({ id: profile.id, jid: null }, runId, 'oi'),
    ).rejects.toMatchObject({ status: 409 });

    expect(sender.sendMessage).not.toHaveBeenCalled();
    expect(messages.create).not.toHaveBeenCalled();
  });

  it('does not record a message WhatsApp refused', async () => {
    const { service, sender, messages } = makeService();
    sender.sendMessage.mockRejectedValue(
      new Error('WhatsApp is not connected.'),
    );

    await expect(service.sendForRun(runId, 'oi')).rejects.toThrow(
      'WhatsApp is not connected.',
    );
    expect(messages.create).not.toHaveBeenCalled();
  });

  it('tells whether the run already has a reply', async () => {
    const { service, messages } = makeService();

    await expect(service.hasReplied(runId)).resolves.toBe(false);

    messages.countAiMessagesOfRun.mockResolvedValue(2);
    await expect(service.hasReplied(runId)).resolves.toBe(true);
  });
});
