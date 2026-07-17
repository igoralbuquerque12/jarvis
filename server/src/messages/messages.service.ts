import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { FindMessagesDto } from './dto/find-messages.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateMessageDto) {
    return this.prisma.message.create({ data });
  }

  findAll({ take }: FindMessagesDto = {}) {
    return this.prisma.message.findMany({
      ...(take !== undefined && { take }),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const message = await this.prisma.message.findUnique({ where: { id } });

    if (!message) {
      throw new NotFoundException(`Message ${id} not found`);
    }

    return message;
  }

  async update(id: string, data: UpdateMessageDto) {
    await this.findOne(id);
    return this.prisma.message.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.message.delete({ where: { id } });
  }
}
