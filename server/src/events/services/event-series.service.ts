import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/services/prisma.service';

@Injectable()
export class EventSeriesService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.EventSeriesUncheckedCreateInput) {
    return this.prisma.eventSeries.create({ data });
  }

  findAll() {
    return this.prisma.eventSeries.findMany();
  }

  async findOne(id: string) {
    const eventSeries = await this.prisma.eventSeries.findUnique({
      where: { id },
    });

    if (!eventSeries) {
      throw new NotFoundException(`Event series ${id} not found`);
    }

    return eventSeries;
  }

  update(id: string, data: Prisma.EventSeriesUpdateInput) {
    return this.prisma.eventSeries.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.eventSeries.delete({ where: { id } });
  }
}
