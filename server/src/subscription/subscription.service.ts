import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateSubscriptionDto) {
    return this.prisma.subscription.create({ data });
  }

  findAll() {
    return this.prisma.subscription.findMany();
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

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.subscription.delete({ where: { id } });
  }

  async ensureDefaultSubscription() {
    const defaultSubscription = {
      name: 'Free Tier',
      price: 0,
      limit: 100,
    };

    const existing = await this.prisma.subscription.findFirst({
      where: { name: defaultSubscription.name },
    });

    if (existing) {
      return existing;
    }

    return this.create(defaultSubscription);
  }
}
