import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createSubjectDto: CreateSubjectDto) {
    return this.prisma.subject.create({
      data: {
        ...createSubjectDto,
        userId,
      },
      include: {
        _count: {
          select: { documents: true },
        },
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.subject.findMany({
      where: { userId },
      include: {
        _count: {
          select: { documents: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const subject = await this.prisma.subject.findFirst({
      where: { id, userId },
      include: {
        documents: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { documents: true },
        },
      },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    return subject;
  }

  async update(id: string, userId: string, updateSubjectDto: UpdateSubjectDto) {
    // Verify ownership
    await this.findOne(id, userId);

    return this.prisma.subject.update({
      where: { id },
      data: updateSubjectDto,
      include: {
        _count: {
          select: { documents: true },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    // Verify ownership
    await this.findOne(id, userId);

    return this.prisma.subject.delete({
      where: { id },
    });
  }
}
