import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/services/prisma.service';
import {
  FREE_TIER_DEFAULTS,
  FREE_TIER_PLAN,
} from '../constants/subscription-plans.constant';
import { CreateSubscriptionDto } from '../dto/create-subscription.dto';
import { UpdateSubscriptionDto } from '../dto/update-subscription.dto';
import { lowestAvailablePlan } from '../utils/lowest-available-plan';

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateSubscriptionDto) {
    const plan = data.plan ?? (await this.nextAvailablePlan());
    return this.prisma.subscription.create({ data: { ...data, plan } });
  }

  /** Plans offered to users; deactivated plans are left out. */
  findAll() {
    return this.prisma.subscription.findMany({
      where: { active: true },
      orderBy: { plan: 'asc' },
    });
  }

  async findOne(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription ${id} not found`);
    }

    return subscription;
  }

  async update(id: string, data: UpdateSubscriptionDto) {
    await this.findOne(id);
    return this.prisma.subscription.update({ where: { id }, data });
  }

  /**
   * Plans are never deleted: freeing a number would let a new plan take a
   * lower rank than existing ones. Deactivating hides it from the listing.
   */
  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.subscription.update({
      where: { id },
      data: { active: false },
    });
  }

  async ensureDefaultSubscription() {
    const existing = await this.prisma.subscription.findUnique({
      where: { plan: FREE_TIER_PLAN },
    });

    if (existing) {
      return existing;
    }

    return this.create({ ...FREE_TIER_DEFAULTS, plan: FREE_TIER_PLAN });
  }

  /** Plan number of a subscription; the free tier if it no longer exists. */
  async findPlanNumber(subscriptionId: string): Promise<number> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: { plan: true },
    });

    return subscription?.plan ?? FREE_TIER_PLAN;
  }

  /** Counts deactivated plans too, so their numbers are never reused. */
  private async nextAvailablePlan(): Promise<number> {
    const rows = await this.prisma.subscription.findMany({
      select: { plan: true },
    });
    return lowestAvailablePlan(rows.map((row) => row.plan));
  }
}
