import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TagsService } from '../tags/tags.service';
import { StorageService, UploadResult } from './storage/storage.service';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  DocumentFilterDto,
} from './dto';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private tagsService: TagsService,
    private storageService: StorageService,
  ) {}

  async create(
    userId: string,
    createDocumentDto: CreateDocumentDto,
    file: Express.Multer.File,
  ) {
    // Upload file to appropriate storage
    const uploadResult: UploadResult = await this.storageService.uploadFile(
      file,
      userId,
    );

    // Process tags
    const tagConnections = await this.processTagsForDocument(
      createDocumentDto.tags || [],
    );

    return this.prisma.document.create({
      data: {
        title: createDocumentDto.title,
        description: createDocumentDto.description,
        subjectId: createDocumentDto.subjectId,
        userId,
        fileUrl: uploadResult.fileUrl,
        storageType: uploadResult.storageType,
        fileName: file.originalname,
        fileSize: BigInt(file.size),
        mimeType: file.mimetype,
        tags: {
          create: tagConnections.map((tagId) => ({
            tag: { connect: { id: tagId } },
          })),
        },
      },
      include: {
        subject: true,
        tags: {
          include: { tag: true },
        },
      },
    });
  }

  async findAll(userId: string, filterDto?: DocumentFilterDto) {
    const where: any = { userId };

    if (filterDto?.subjectId) {
      where.subjectId = filterDto.subjectId;
    }

    if (filterDto?.search) {
      where.OR = [
        { title: { contains: filterDto.search, mode: 'insensitive' } },
        { description: { contains: filterDto.search, mode: 'insensitive' } },
      ];
    }

    if (filterDto?.tags && filterDto.tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            name: { in: filterDto.tags },
          },
        },
      };
    }

    return this.prisma.document.findMany({
      where,
      include: {
        subject: true,
        tags: {
          include: { tag: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const document = await this.prisma.document.findFirst({
      where: { id, userId },
      include: {
        subject: true,
        tags: {
          include: { tag: true },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async update(
    id: string,
    userId: string,
    updateDocumentDto: UpdateDocumentDto,
  ) {
    // Verify ownership
    await this.findOne(id, userId);

    // Process tags if provided
    let tagConnections: string[] = [];
    if (updateDocumentDto.tags) {
      tagConnections = await this.processTagsForDocument(updateDocumentDto.tags);

      // Remove existing tags
      await this.prisma.documentTag.deleteMany({
        where: { documentId: id },
      });
    }

    return this.prisma.document.update({
      where: { id },
      data: {
        title: updateDocumentDto.title,
        description: updateDocumentDto.description,
        subjectId: updateDocumentDto.subjectId,
        ...(updateDocumentDto.tags && {
          tags: {
            create: tagConnections.map((tagId) => ({
              tag: { connect: { id: tagId } },
            })),
          },
        }),
      },
      include: {
        subject: true,
        tags: {
          include: { tag: true },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const document = await this.findOne(id, userId);

    // Delete file from storage
    await this.storageService.deleteFile(document.fileUrl, document.storageType);

    return this.prisma.document.delete({
      where: { id },
    });
  }

  private async processTagsForDocument(tagNames: string[]): Promise<string[]> {
    const tagIds: string[] = [];

    for (const name of tagNames) {
      const tag = await this.tagsService.findOrCreate(name);
      tagIds.push(tag.id);
    }

    return tagIds;
  }
}
