import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async create(createTagDto: CreateTagDto) {
    const existing = await this.prisma.tag.findUnique({
      where: { name: createTagDto.name },
    });

    if (existing) {
      throw new ConflictException('Tag already exists');
    }

    return this.prisma.tag.create({
      data: createTagDto,
    });
  }

  async findAll() {
    return this.prisma.tag.findMany({
      include: {
        _count: {
          select: { documents: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOrCreate(name: string) {
    const existing = await this.prisma.tag.findUnique({
      where: { name },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.tag.create({
      data: { name },
    });
  }

  async remove(id: string) {
    return this.prisma.tag.delete({
      where: { id },
    });
  }
}
