import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { google, drive_v3 } from 'googleapis';
import { StorageType } from '@prisma/client';
import { Readable } from 'stream';

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

    // Google Drive client (service account)
    this.initGoogleDrive();
  }

  private initGoogleDrive(): void {
    const clientEmail = this.configService.get<string>(
      'GOOGLE_DRIVE_CLIENT_EMAIL',
    );
    const privateKey = this.configService.get<string>(
      'GOOGLE_DRIVE_PRIVATE_KEY',
    );
    const folderId = this.configService.get<string>('GOOGLE_DRIVE_FOLDER_ID');

    if (!clientEmail || !privateKey || !folderId) {
      this.logger.warn(
        'Google Drive credentials not configured – large files will fall back to Supabase',
      );
      return;
    }

    try {
      const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });

      this.drive = google.drive({ version: 'v3', auth });
      this.driveFolderId = folderId;
      this.logger.log('Google Drive service account initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Google Drive:', error);
    }
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

  async deleteFile(fileUrl: string, storageType: StorageType): Promise<void> {
    switch (storageType) {
      case StorageType.SUPABASE: {
        const path = fileUrl.split('/documents/')[1];
        if (path) {
          await this.supabase.storage.from('documents').remove([path]);
        }
        break;
      }
      case StorageType.GDRIVE: {
        await this.deleteFromGoogleDrive(fileUrl);
        break;
      }
      case StorageType.CLOUDINARY:
        // TODO: Implement Cloudinary delete
        break;
    }
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
      storageType: StorageType.SUPABASE,
    };
  }

  // ── Google Drive ─────────────────────────────────────────────

  private async uploadToGoogleDrive(
    file: Express.Multer.File,
    userId: string,
  ): Promise<UploadResult> {
    if (!this.drive || !this.driveFolderId) {
      this.logger.warn('Google Drive not ready, falling back to Supabase');
      return this.uploadToSupabase(file, userId);
    }

    try {
      // Ensure a user sub-folder exists
      const userFolderId = await this.getOrCreateUserFolder(userId);

      const driveFileName = `${Date.now()}-${file.originalname}`;

      const response = await this.drive.files.create({
        requestBody: {
          name: driveFileName,
          parents: [userFolderId],
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
        storageType: StorageType.GDRIVE,
      };
    } catch (error) {
      this.logger.error('Google Drive upload failed, falling back to Supabase:', error);
      return this.uploadToSupabase(file, userId);
    }
  }

  /** Find or create a per-user sub-folder inside the root Drive folder */
  private async getOrCreateUserFolder(userId: string): Promise<string> {
    if (!this.drive || !this.driveFolderId) {
      throw new Error('Drive not initialized');
    }

    // Search for existing folder
    const query = `name='${userId}' and '${this.driveFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const list = await this.drive.files.list({
      q: query,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (list.data.files && list.data.files.length > 0) {
      return list.data.files[0].id!;
    }

    // Create new folder
    const folder = await this.drive.files.create({
      requestBody: {
        name: userId,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [this.driveFolderId],
      },
      fields: 'id',
    });

    this.logger.log(`Created Drive folder for user ${userId}`);
    return folder.data.id!;
  }

  private async deleteFromGoogleDrive(fileUrl: string): Promise<void> {
    if (!this.drive) return;

    try {
      // Extract file ID from URL patterns like:
      // https://drive.google.com/file/d/FILE_ID/view
      // https://drive.google.com/open?id=FILE_ID
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
