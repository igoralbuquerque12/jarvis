import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateProfileDto) {
    return this.prisma.profile.create({ data });
  }

  findAll() {
    return this.prisma.profile.findMany();
  }

  async findOne(filters: { id?: string; jid?: string }) {
    const { id, jid } = filters;

    if (!id && !jid) {
      throw new NotFoundException('Unique filter not provided');
    }

    return await this.prisma.profile.findUnique({
      where: id ? { id } : { jid: jid! },
    });
  }

  async update(id: string, data: UpdateProfileDto) {
    await this.findOne({ id });
    return this.prisma.profile.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne({ id });
    return this.prisma.profile.delete({ where: { id } });
  }
}
