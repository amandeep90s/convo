import { pipeline } from 'node:stream/promises';

import {
  BadRequestException,
  Body,
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
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';

import {
  ApiCreatedEndpoint,
  ApiEndpoint,
} from '@/common/decorators/api-endpoint.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { AttachmentMessageOptionsDto } from '@/common/dtos/api.dto';
import type { AuthenticatedUser } from '@/common/types/authenticated-user';
import {
  MessageAttachmentsService,
  type UploadedMessageFile,
} from '@/message-attachments/providers/message-attachments.service';

@Controller('message-attachments')
@ApiTags('Message attachments')
@ApiBearerAuth('access-token')
export class MessageAttachmentsController {
  constructor(private readonly attachmentsService: MessageAttachmentsService) {}

  @Get()
  @ApiEndpoint('List attachments on a message')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('messageId', ParseUUIDPipe) messageId: string,
  ) {
    return this.attachmentsService.list(user.id, messageId);
  }

  @Post('conversations/:conversationId/upload')
  @ApiCreatedEndpoint(
    'Upload a file and send its message after storage completes',
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        reply_to_id: { type: 'string', format: 'uuid' },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 20 * 1024 * 1024, files: 1 },
    }),
  )
  @ResponseMessage('Attachment message sent')
  uploadToConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @UploadedFile() file: UploadedMessageFile,
    @Body() options: AttachmentMessageOptionsDto,
  ) {
    if (!file) throw new BadRequestException('A file is required');
    return this.attachmentsService.uploadToConversation(
      user.id,
      conversationId,
      file,
      options.reply_to_id,
    );
  }

  @Post('upload/:messageId')
  @ApiCreatedEndpoint('Upload an attachment to a message')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
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
  @ApiOperation({ summary: 'Download an attachment' })
  @ApiProduces('application/octet-stream')
  @ApiOkResponse({
    description: 'Attachment file stream',
    schema: { type: 'string', format: 'binary' },
  })
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
  @ApiEndpoint('Delete an attachment')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
  ) {
    return this.attachmentsService.remove(user.id, attachmentId);
  }
}
