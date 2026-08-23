import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { BetterAuthService } from '../../auth/services/better-auth.service';
import { SubscriptionService } from '../services/subscription.service';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly authService: BetterAuthService,
  ) {}

  @Get()
  async findAll(@Req() request: Request) {
    await this.authService.requireSession(request.headers);
    const subscriptions = await this.subscriptionService.findAll();

    return subscriptions.map((subscription) => ({
      id: subscription.id,
      name: subscription.name,
      price: Number(subscription.price),
      limit: subscription.limit,
    }));
  }
}
