import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  Body,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService, UploadResult } from './storage.service';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB max

/**
 * Storage-only endpoint for file uploads.
 * Routes files by size:
 *   - >= 10MB → Google Drive
 *   - < 10MB → Supabase Storage
 * 
 * NOTE: Auth disabled for development. Enable SupabaseGuard for production.
 */
@Controller('storage')
export class StorageController {
  private logger = new Logger(StorageController.name);

  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE })],
      }),
    )
    file: Express.Multer.File,
    @Body('userId') userId: string,
  ): Promise<UploadResult> {
    this.logger.log(
      `Storage upload: ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)} MB) for user ${userId}`,
    );
    return this.storageService.uploadFile(file, userId || 'anonymous');
  }
}
