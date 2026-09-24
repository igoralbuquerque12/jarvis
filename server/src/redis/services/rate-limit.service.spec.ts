import { HttpException, HttpStatus } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RateLimitService } from './rate-limit.service';

describe('RateLimitService', () => {
  let redisClient: { set: jest.Mock };
  let service: RateLimitService;

  beforeEach(() => {
    redisClient = { set: jest.fn().mockResolvedValue('OK') };
    service = new RateLimitService(
      { getClient: () => redisClient } as unknown as RedisService,
    );
  });

  it('acquires a 60-second lock for the provided key', async () => {
    await expect(service.check('rate-limit:key-1')).resolves.toBeUndefined();

    expect(redisClient.set).toHaveBeenCalledWith('rate-limit:key-1', '1', {
      NX: true,
      EX: 60,
    });
  });

  it('returns an English 429 response when the lock already exists', async () => {
    redisClient.set.mockResolvedValue(null);
    let error: unknown;

    try {
      await service.check('rate-limit:key-1');
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(
      HttpStatus.TOO_MANY_REQUESTS,
    );
    expect((error as HttpException).getResponse()).toBe(
      'Rate limit exceeded. Please try again in one minute.',
    );
  });
});
