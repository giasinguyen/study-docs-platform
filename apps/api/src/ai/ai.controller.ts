import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  BadRequestException,
  InternalServerErrorException,
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
  private logger = new Logger(AiController.name);

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
    try {
      return await this.aiService.summarize(file, length || 'medium');
    } catch (error: any) {
      this.logger.error(`Summarize failed: ${error?.message}`, error?.stack);
      if (error?.status) throw error;
      throw new InternalServerErrorException(error?.message || 'AI summarize failed');
    }
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
    try {
      return await this.aiService.generateFlashcards(file, num);
    } catch (error: any) {
      this.logger.error(`Flashcards failed: ${error?.message}`, error?.stack);
      if (error?.status) throw error;
      throw new InternalServerErrorException(error?.message || 'AI flashcards failed');
    }
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

    try {
      if (file) {
        return await this.aiService.chatWithFile(file, message, history);
      }

      if (documentText) {
        return await this.aiService.chatWithDocument(documentText, message, history);
      }

      throw new BadRequestException(
        'Either file or documentText is required',
      );
    } catch (error: any) {
      if (error?.status) throw error;
      this.logger.error(`Chat failed: ${error?.message}`, error?.stack);
      throw new InternalServerErrorException(error?.message || 'AI chat failed');
    }
  }
}
