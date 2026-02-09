import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  DocumentFilterDto,
} from './dto';
import { SupabaseGuard } from '../auth/guards/supabase.guard';
import { User } from '@prisma/client';

interface RequestWithUser extends Request {
  user: User;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB max

@Controller('documents')
@UseGuards(SupabaseGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Request() req: RequestWithUser,
    @Body() createDocumentDto: CreateDocumentDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE })],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.documentsService.create(req.user.id, createDocumentDto, file);
  }

  @Get()
  findAll(
    @Request() req: RequestWithUser,
    @Query() filterDto: DocumentFilterDto,
  ) {
    return this.documentsService.findAll(req.user.id, filterDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.documentsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(id, req.user.id, updateDocumentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.documentsService.remove(id, req.user.id);
  }
}
