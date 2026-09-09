import { Controller, Get, Param, Post, StreamableFile, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import { CurrentUser, Roles } from '../auth/auth.decorators';
import type { AuthTokenPayload } from '../auth/auth.types';
import { DocumentsService } from './documents.service';
import type { UploadedCreditFile } from './documents.types';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0 } }))
  upload(@UploadedFile() file: UploadedCreditFile | undefined, @CurrentUser() user: AuthTokenPayload) {
    return this.documents.upload(file, user.sub);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.ANALYST, UserRole.CASHIER)
  async download(@Param('id') id: string, @CurrentUser() user: AuthTokenPayload) {
    const { document, content } = await this.documents.download(id, user.sub);
    return new StreamableFile(content, { type: 'application/octet-stream', length: content.length,
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(document.fileName)}` });
  }
}
