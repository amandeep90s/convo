import { pipeline } from 'node:stream/promises';

import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import type { AuthenticatedUser } from '@/common/types/authenticated-user';
import {
  MessageAttachmentsService,
  type UploadedMessageFile,
} from '@/message-attachments/providers/message-attachments.service';

@Controller('message-attachments')
export class MessageAttachmentsController {
  constructor(private readonly attachmentsService: MessageAttachmentsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('messageId', ParseUUIDPipe) messageId: string,
  ) {
    return this.attachmentsService.list(user.id, messageId);
  }

  @Post('upload/:messageId')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 20 * 1024 * 1024, files: 1 },
      fileFilter: (_request, file, callback) => {
        const supported = new Set([
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'video/mp4',
          'audio/mpeg',
          'audio/ogg',
          'audio/wav',
          'application/pdf',
          'text/plain',
        ]);
        if (!supported.has(file.mimetype)) {
          callback(new BadRequestException('Unsupported file type'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  @ResponseMessage('Attachment uploaded')
  upload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @UploadedFile() file: UploadedMessageFile,
  ) {
    if (!file) throw new BadRequestException('A file is required');
    return this.attachmentsService.upload(user.id, messageId, file);
  }

  @Get(':attachmentId/file')
  async download(
    @CurrentUser() user: AuthenticatedUser,
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
    @Res() response: Response,
  ) {
    const file = await this.attachmentsService.download(user.id, attachmentId);
    response.setHeader('Content-Type', file.mimeType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
    );
    await pipeline(file.stream, response);
  }

  @Delete(':attachmentId')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
  ) {
    return this.attachmentsService.remove(user.id, attachmentId);
  }
}
