import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

const RATE_LIMIT_WINDOW_SECONDS = 60;

/** Enforces a one-request-per-minute limit for an arbitrary Redis key. */
@Injectable()
export class RateLimitService {
  constructor(private readonly redisService: RedisService) {}

  async check(key: string): Promise<void> {
    const acquired = await this.redisService.getClient().set(key, '1', {
      NX: true,
      EX: RATE_LIMIT_WINDOW_SECONDS,
    });

    if (acquired !== 'OK') {
      throw new HttpException(
        'Rate limit exceeded. Please try again in one minute.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
