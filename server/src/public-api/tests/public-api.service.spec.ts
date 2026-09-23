import { ConflictException, HttpException, HttpStatus } from '@nestjs/common';
import type { Profile } from '@prisma/client';
import { RedisService } from '../../redis/services/redis.service';
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
  let redisClient: { set: jest.Mock };
  let service: PublicApiService;

  beforeEach(() => {
    sender = { sendMessage: jest.fn().mockResolvedValue({ sent: true }) };
    redisClient = { set: jest.fn().mockResolvedValue('OK') };
    service = new PublicApiService(
      sender as unknown as WhatsappSenderService,
      { getClient: () => redisClient } as unknown as RedisService,
    );
  });

  it('sends the trimmed message to the owner jid', async () => {
    const profile = buildProfile('5511999999999@s.whatsapp.net');

    const result = await service.sendMessageToSelf('key-1', profile, '  olá  ');

    expect(redisClient.set).toHaveBeenCalledWith(
      'public-api:messages:rate-limit:key-1',
      '1',
      { NX: true, EX: 60 },
    );
    expect(sender.sendMessage).toHaveBeenCalledWith(profile.jid, 'olá');
    expect(result.sent).toBe(true);
    expect(result.sentAt).toBeInstanceOf(Date);
  });

  it('refuses when the profile has not paired WhatsApp yet', async () => {
    const profile = buildProfile('igor@example.com');

    await expect(service.sendMessageToSelf('key-1', profile, 'olá')).rejects.toThrow(
      ConflictException,
    );
    expect(sender.sendMessage).not.toHaveBeenCalled();
  });

  it('limits each API key to one request per minute', async () => {
    redisClient.set.mockResolvedValue(null);
    const profile = buildProfile('5511999999999@s.whatsapp.net');

    await expect(
      service.sendMessageToSelf('key-1', profile, 'Hello'),
    ).rejects.toMatchObject({
      status: HttpStatus.TOO_MANY_REQUESTS,
      message: 'Rate limit exceeded. Please try again in one minute.',
    } satisfies Partial<HttpException>);
    expect(sender.sendMessage).not.toHaveBeenCalled();
  });
});
