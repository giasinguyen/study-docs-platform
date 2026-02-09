import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { StorageService } from './storage/storage.service';
import { StorageController } from './storage/storage.controller';
import { TagsModule } from '../tags/tags.module';

@Module({
  imports: [TagsModule],
  controllers: [DocumentsController, StorageController],
  providers: [DocumentsService, StorageService],
  exports: [DocumentsService, StorageService],
})
export class DocumentsModule {}
