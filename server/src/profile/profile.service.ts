import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SubscriptionService } from '../subscription/subscription.service';
import { ProfileAuthUser } from './entities/profile-auth-user';
import { generateToken } from './utils/generate-token';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  create(data: CreateProfileDto) {
    return this.prisma.profile.create({ data });
  }

  findAll() {
    return this.prisma.profile.findMany();
  }

  async findOne(filters: {
    id?: string;
    jid?: string;
    userId?: string;
    token?: string;
  }) {
    const { id, jid, userId, token } = filters;

    if (!id && !jid && !userId && !token) {
      throw new NotFoundException('Unique filter not provided');
    }

    if (token || userId) {
      return this.prisma.profile.findFirst({
        where: {
          ...(id ? { id } : {}),
          ...(jid ? { jid } : {}),
          ...(userId ? { userId } : {}),
          ...(token ? { token } : {}),
        },
      });
    }

    return this.prisma.profile.findUnique({
      where: id ? { id } : { jid: jid! },
    });
  }

  async ensureAuthProfile(user: ProfileAuthUser) {
    const existingProfile = await this.findOne({ userId: user.id });

    if (existingProfile) {
      return existingProfile;
    }

    const subscription =
      await this.subscriptionService.ensureDefaultSubscription();
    const displayName =
      user.name.trim().length > 0 ? user.name.trim() : user.email.split('@')[0];

    return this.create({
      userId: user.id,
      name: displayName,
      token: generateToken(10),
      jid: user.email,
      about: '',
      active: true,
      subscriptionId: subscription.id,
    });
  }

  async update(id: string, data: UpdateProfileDto) {
    await this.findOne({ id });
    return this.prisma.profile.update({ where: { id }, data });
  }

  async updateByUserId(userId: string, data: UpdateProfileDto) {
    const profile = await this.findOne({ userId });

    if (!profile) {
      throw new NotFoundException(`Profile for user ${userId} not found`);
    }

    return this.prisma.profile.update({
      where: { userId },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne({ id });
    return this.prisma.profile.delete({ where: { id } });
  }
}
