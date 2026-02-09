import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService, ChatMessage } from './ai.service';

const MAX_AI_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// NOTE: Auth guard disabled for development. Enable SupabaseGuard for production:
// import { SupabaseGuard } from '../auth/guards/supabase.guard';
// @UseGuards(SupabaseGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('summarize')
  @UseInterceptors(FileInterceptor('file'))
  async summarize(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: MAX_AI_FILE_SIZE })],
      }),
    )
    file: Express.Multer.File,
    @Body('length') length?: 'short' | 'medium' | 'detailed',
  ) {
    return this.aiService.summarize(file, length || 'medium');
  }

  @Post('flashcards')
  @UseInterceptors(FileInterceptor('file'))
  async flashcards(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: MAX_AI_FILE_SIZE })],
      }),
    )
    file: Express.Multer.File,
    @Body('count') count?: string,
  ) {
    const num = count ? parseInt(count, 10) : 10;
    if (isNaN(num) || num < 1 || num > 50) {
      throw new BadRequestException('Count must be 1-50');
    }
    return this.aiService.generateFlashcards(file, num);
  }

  @Post('chat')
  @UseInterceptors(FileInterceptor('file'))
  async chat(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('message') message: string,
    @Body('documentText') documentText?: string,
    @Body('history') historyJson?: string,
  ) {
    if (!message) {
      throw new BadRequestException('Message is required');
    }

    let history: ChatMessage[] = [];
    if (historyJson) {
      try {
        history = JSON.parse(historyJson);
      } catch {
        history = [];
      }
    }

    if (file) {
      return this.aiService.chatWithFile(file, message, history);
    }

    if (documentText) {
      return this.aiService.chatWithDocument(documentText, message, history);
    }

    throw new BadRequestException(
      'Either file or documentText is required',
    );
  }
}
