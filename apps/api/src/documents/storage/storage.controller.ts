import {
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  Body,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
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
@Controller()
export class StorageController {
  private logger = new Logger(StorageController.name);

  constructor(private readonly storageService: StorageService) {}

  @Post('storage/upload')
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

  /**
   * Step 1: Get Google OAuth URL.
   * Visit this URL in a browser to authorize Drive access.
   */
  @Get('storage/oauth/url')
  getOAuthUrl(): { url: string; instructions: string } {
    const url = this.storageService.getAuthUrl();
    return {
      url,
      instructions:
        'Open this URL in your browser, sign in with your Google account, and grant access. ' +
        'You will be redirected back with a refresh token to put in your .env file.',
    };
  }

  /**
   * Step 2: OAuth callback – receives the authorization code from Google.
   * Exchanges it for a refresh token and displays it.
   */
  @Get('auth/google/callback')
  async oauthCallback(
    @Query('code') code: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const refreshToken = await this.storageService.exchangeCode(code);
      this.logger.log('Google OAuth refresh token obtained successfully');

      res.type('html').send(`
        <html>
        <body style="font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 20px;">
          <h2 style="color: #22c55e;">✅ Google Drive Connected!</h2>
          <p>Add this to your <code>.env</code> file:</p>
          <pre style="background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 8px; overflow-x: auto; word-break: break-all; white-space: pre-wrap;">GOOGLE_OAUTH_REFRESH_TOKEN=${refreshToken}</pre>
          <p>Then restart the API server.</p>
          <p style="color: #71717a; font-size: 14px;">You can close this tab now.</p>
        </body>
        </html>
      `);
    } catch (error: any) {
      this.logger.error('OAuth callback failed:', error);
      res.status(500).type('html').send(`
        <html>
        <body style="font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 20px;">
          <h2 style="color: #ef4444;">❌ Error</h2>
          <p>${error?.message || 'Failed to exchange authorization code'}</p>
          <p>Try again: <a href="/storage/oauth/url">Get new auth URL</a></p>
        </body>
        </html>
      `);
    }
  }
}
