import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';

export type StorageType = 'SUPABASE' | 'GDRIVE' | 'CLOUDINARY';

export interface UploadResult {
  fileUrl: string;
  storageType: StorageType;
}

/** Files >= 10 MB go to Google Drive, smaller files stay in Supabase */
const DRIVE_THRESHOLD = 10 * 1024 * 1024; // 10 MB

@Injectable()
export class StorageService {
  private supabase: SupabaseClient;
  private drive: drive_v3.Drive | null = null;
  private driveFolderId: string | null = null;
  private logger = new Logger(StorageService.name);

  constructor(private configService: ConfigService) {
    // Supabase client
    this.supabase = createClient(
      this.configService.get<string>('NEXT_PUBLIC_SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Google Drive client (OAuth 2.0 for personal accounts)
    this.initGoogleDrive();
  }

  private initGoogleDrive(): void {
    const clientId = this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_OAUTH_CLIENT_SECRET');
    const refreshToken = this.configService.get<string>('GOOGLE_OAUTH_REFRESH_TOKEN');
    const folderId = this.configService.get<string>('GOOGLE_DRIVE_FOLDER_ID');

    if (!clientId || !clientSecret || !refreshToken) {
      this.logger.warn(
        'Google Drive OAuth not configured – large files will fall back to Supabase. ' +
        'Run GET /storage/oauth/url to set up Google Drive.',
      );
      return;
    }

    try {
      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
      oauth2Client.setCredentials({ refresh_token: refreshToken });

      this.drive = google.drive({ version: 'v3', auth: oauth2Client });
      this.driveFolderId = folderId || null;
      this.logger.log('Google Drive initialized with OAuth 2.0 (personal account)');
    } catch (error) {
      this.logger.error('Failed to initialize Google Drive:', error);
    }
  }

  /** Generate Google OAuth authorization URL (for one-time token retrieval) */
  getAuthUrl(): string {
    const clientId = this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_OAUTH_CLIENT_SECRET');
    const redirectUri = `http://localhost:${this.configService.get('PORT') || 3001}/auth/google/callback`;

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/drive.file'],
    });
  }

  /** Exchange authorization code for tokens */
  async exchangeCode(code: string): Promise<string> {
    const clientId = this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_OAUTH_CLIENT_SECRET');
    const redirectUri = `http://localhost:${this.configService.get('PORT') || 3001}/auth/google/callback`;

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      throw new Error('No refresh token returned. Make sure to revoke access and try again.');
    }

    return tokens.refresh_token;
  }

  // ── public API ───────────────────────────────────────────────

  async uploadFile(
    file: Express.Multer.File,
    userId: string,
  ): Promise<UploadResult> {
    this.logger.log(
      `Upload request: ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)} MB), threshold: ${(DRIVE_THRESHOLD / 1024 / 1024).toFixed(0)} MB, drive ready: ${!!this.drive}`,
    );

    // Route by size: >= 10 MB → Google Drive, < 10 MB → Supabase
    if (file.size >= DRIVE_THRESHOLD && this.drive) {
      this.logger.log('Routing to Google Drive (file >= 10MB)');
      return this.uploadToGoogleDrive(file, userId);
    }

    if (file.size >= DRIVE_THRESHOLD && !this.drive) {
      this.logger.warn(
        'File >= 10MB but Google Drive not initialized, falling back to Supabase',
      );
    }

    return this.uploadToSupabase(file, userId);
  }

  // ── Supabase ─────────────────────────────────────────────────

  private async uploadToSupabase(
    file: Express.Multer.File,
    userId: string,
  ): Promise<UploadResult> {
    const fileName = `${userId}/${Date.now()}-${file.originalname}`;

    const { data, error } = await this.supabase.storage
      .from('documents')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      this.logger.error('Supabase upload error:', error);
      throw new Error(`Failed to upload to Supabase: ${error.message}`);
    }

    const {
      data: { publicUrl },
    } = this.supabase.storage.from('documents').getPublicUrl(data.path);

    this.logger.log(
      `Uploaded to Supabase (${(file.size / 1024 / 1024).toFixed(2)} MB): ${file.originalname}`,
    );

    return {
      fileUrl: publicUrl,
      storageType: 'SUPABASE',
    };
  }

  // ── Google Drive (OAuth 2.0 – personal account) ──────────────

  private async uploadToGoogleDrive(
    file: Express.Multer.File,
    userId: string,
  ): Promise<UploadResult> {
    if (!this.drive) {
      this.logger.warn('Google Drive not ready, falling back to Supabase');
      return this.uploadToSupabase(file, userId);
    }

    try {
      const parentId = await this.getOrCreateUserFolder(userId);
      const driveFileName = `${Date.now()}-${file.originalname}`;

      const response = await this.drive.files.create({
        requestBody: {
          name: driveFileName,
          parents: [parentId],
          mimeType: file.mimetype,
        },
        media: {
          mimeType: file.mimetype,
          body: Readable.from(file.buffer),
        },
        fields: 'id, webViewLink',
      });

      const fileId = response.data.id!;

      // Make the file readable via link
      await this.drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      const fileUrl =
        response.data.webViewLink ||
        `https://drive.google.com/file/d/${fileId}/view`;

      this.logger.log(
        `Uploaded to Google Drive (${(file.size / 1024 / 1024).toFixed(2)} MB): ${file.originalname}`,
      );

      return {
        fileUrl,
        storageType: 'GDRIVE',
      };
    } catch (error: any) {
      this.logger.error(`Google Drive upload failed: ${error?.message || error}`);
      this.logger.error('Falling back to Supabase');
      return this.uploadToSupabase(file, userId);
    }
  }

  /** Find or create a per-user sub-folder in the target Drive folder */
  private async getOrCreateUserFolder(userId: string): Promise<string> {
    if (!this.drive) {
      throw new Error('Drive not initialized');
    }

    const parentId = this.driveFolderId;

    let q = `name='${userId}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    if (parentId) {
      q += ` and '${parentId}' in parents`;
    }

    const list = await this.drive.files.list({
      q,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (list.data.files && list.data.files.length > 0) {
      return list.data.files[0].id!;
    }

    // Create new folder
    const requestBody: any = {
      name: userId,
      mimeType: 'application/vnd.google-apps.folder',
    };
    if (parentId) {
      requestBody.parents = [parentId];
    }

    const folder = await this.drive.files.create({
      requestBody,
      fields: 'id',
    });

    this.logger.log(`Created Drive folder for user ${userId}`);
    return folder.data.id!;
  }

  async deleteFile(fileUrl: string, storageType: StorageType): Promise<void> {
    if (storageType === 'GDRIVE') {
      await this.deleteFromGoogleDrive(fileUrl);
    } else if (storageType === 'SUPABASE') {
      const path = fileUrl.split('/documents/')[1];
      if (path) {
        await this.supabase.storage.from('documents').remove([path]);
      }
    }
  }

  private async deleteFromGoogleDrive(fileUrl: string): Promise<void> {
    if (!this.drive) return;

    try {
      const match =
        fileUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
        fileUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);

      if (match?.[1]) {
        await this.drive.files.delete({ fileId: match[1] });
        this.logger.log(`Deleted file from Google Drive: ${match[1]}`);
      }
    } catch (error) {
      this.logger.error('Google Drive delete failed:', error);
    }
  }
}
