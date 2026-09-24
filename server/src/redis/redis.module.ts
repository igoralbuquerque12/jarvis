import { Global, Module } from '@nestjs/common';
import { RateLimitService } from './services/rate-limit.service';
import { RedisService } from './services/redis.service';

@Global()
@Module({
  providers: [RedisService, RateLimitService],
  exports: [RedisService, RateLimitService],
})
export class RedisModule {}
