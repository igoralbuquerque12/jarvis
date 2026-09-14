import { ConflictException } from '@nestjs/common';
import type { Profile } from '@prisma/client';
import { WhatsappSenderService } from '../../whatsapp/services/whatsapp-sender.service';
import { PublicApiService } from '../services/public-api.service';

function buildProfile(jid: string): Profile {
  return {
    id: 'profile-1',
    userId: 'user-1',
    name: 'Igor',
    token: 'ABCDEFGHIJ',
    jid,
    about: '',
    timezone: 'America/Sao_Paulo',
    active: true,
    subscriptionId: 'sub-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('PublicApiService', () => {
  let sender: { sendMessage: jest.Mock };
  let service: PublicApiService;

  beforeEach(() => {
    sender = { sendMessage: jest.fn().mockResolvedValue({ sent: true }) };
    service = new PublicApiService(sender as unknown as WhatsappSenderService);
  });

  it('sends the trimmed message to the owner jid', async () => {
    const profile = buildProfile('5511999999999@s.whatsapp.net');

    const result = await service.sendMessageToSelf(profile, '  olá  ');

    expect(sender.sendMessage).toHaveBeenCalledWith(profile.jid, 'olá');
    expect(result.sent).toBe(true);
    expect(result.sentAt).toBeInstanceOf(Date);
  });

  it('refuses when the profile has not paired WhatsApp yet', async () => {
    const profile = buildProfile('igor@example.com');

    await expect(service.sendMessageToSelf(profile, 'olá')).rejects.toThrow(
      ConflictException,
    );
    expect(sender.sendMessage).not.toHaveBeenCalled();
  });
});
