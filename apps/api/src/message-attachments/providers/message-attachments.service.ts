import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { access as accessFile } from 'node:fs/promises';
import path from 'node:path';

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ConversationAccessService } from '@/common/providers/conversation-access.service';
import { PrismaService } from '@/prisma.service';
import { RealtimeGateway } from '@/realtime/realtime.gateway';

export type UploadedMessageFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Injectable()
export class MessageAttachmentsService {
  private readonly uploadDir: string;
  private readonly allowedMimeTypes = new Set([
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

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly access: ConversationAccessService,
    private readonly realtime: RealtimeGateway,
  ) {
    this.uploadDir = this.configService.getOrThrow<string>('app.uploadDir');
  }

  async list(userId: string, messageId: string) {
    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        deleted_at: null,
        OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
      },
      select: { conversation_id: true },
    });
    if (!message) throw new NotFoundException('Message not found');
    await this.access.requireMember(message.conversation_id, userId);
    const attachments = await this.prisma.messageAttachment.findMany({
      where: { message_id: messageId },
      select: {
        id: true,
        message_id: true,
        type: true,
        mime_type: true,
        file_name: true,
        file_size: true,
        width: true,
        height: true,
        duration_ms: true,
        created_at: true,
      },
      orderBy: { created_at: 'asc' },
    });
    return attachments.map((attachment) => ({
      ...attachment,
      file_size:
        attachment.file_size === null ? null : Number(attachment.file_size),
      duration_ms:
        attachment.duration_ms === null ? null : Number(attachment.duration_ms),
    }));
  }

  async upload(userId: string, messageId: string, file: UploadedMessageFile) {
    if (!this.allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException('Unsupported file type');
    }
    if (file.size < 1 || file.size > 20 * 1024 * 1024) {
      throw new BadRequestException('Files must be between 1 byte and 20 MB');
    }
    const message = await this.prisma.message.findFirst({
      where: { id: messageId, deleted_at: null },
      select: { id: true, sender_id: true, conversation_id: true },
    });
    if (!message) throw new NotFoundException('Message not found');
    await this.access.requireMember(message.conversation_id, userId);
    if (message.sender_id !== userId) {
      throw new ForbiddenException(
        'Only the message sender can add attachments',
      );
    }

    await mkdir(this.uploadDir, { recursive: true });
    const extension = path
      .extname(path.basename(file.originalname))
      .slice(0, 12);
    const storageKey = `${randomUUID()}${extension}`;
    const filePath = path.join(this.uploadDir, storageKey);
    await writeFile(filePath, file.buffer, { flag: 'wx' });
    const attachment = await this.prisma.messageAttachment
      .create({
        data: {
          message_id: messageId,
          type: typeForMime(file.mimetype),
          storage_key: storageKey,
          mime_type: file.mimetype,
          file_name: path.basename(file.originalname).slice(0, 255),
          file_size: BigInt(file.size),
        },
        select: {
          id: true,
          message_id: true,
          type: true,
          mime_type: true,
          file_name: true,
          file_size: true,
          created_at: true,
        },
      })
      .catch(async (error: unknown) => {
        await unlink(filePath);
        throw error;
      });
    await this.realtime.emitConversationEvent(
      message.conversation_id,
      'message:attachment',
      { message_id: messageId },
    );
    return { ...attachment, file_size: Number(attachment.file_size) };
  }

  async download(userId: string, attachmentId: string) {
    const attachment = await this.prisma.messageAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        message: {
          select: { conversation_id: true, deleted_at: true, expires_at: true },
        },
      },
    });
    if (
      !attachment ||
      attachment.message.deleted_at ||
      (attachment.message.expires_at &&
        attachment.message.expires_at <= new Date())
    ) {
      throw new NotFoundException('Attachment not found');
    }
    await this.access.requireMember(attachment.message.conversation_id, userId);
    if (path.basename(attachment.storage_key) !== attachment.storage_key) {
      throw new BadRequestException('Invalid attachment storage key');
    }
    const filePath = path.join(this.uploadDir, attachment.storage_key);
    try {
      await accessFile(filePath);
    } catch (error) {
      if (isMissingFile(error))
        throw new NotFoundException('Attachment file not found');
      throw error;
    }
    return {
      stream: createReadStream(filePath),
      mimeType: attachment.mime_type,
      fileName: attachment.file_name ?? 'attachment',
    };
  }

  async remove(userId: string, attachmentId: string) {
    const attachment = await this.prisma.messageAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        message: {
          select: {
            sender_id: true,
            conversation_id: true,
            deleted_at: true,
            expires_at: true,
          },
        },
      },
    });
    if (
      !attachment ||
      attachment.message.deleted_at ||
      (attachment.message.expires_at &&
        attachment.message.expires_at <= new Date())
    ) {
      throw new NotFoundException('Attachment not found');
    }
    const member = await this.access.requireMember(
      attachment.message.conversation_id,
      userId,
    );
    if (attachment.message.sender_id !== userId && member.role !== 'admin') {
      throw new ForbiddenException('You cannot remove this attachment');
    }
    await this.prisma.messageAttachment.delete({ where: { id: attachmentId } });
    if (path.basename(attachment.storage_key) === attachment.storage_key) {
      await unlink(path.join(this.uploadDir, attachment.storage_key)).catch(
        (error: NodeJS.ErrnoException) => {
          if (error.code !== 'ENOENT') throw error;
        },
      );
    }
    await this.realtime.emitConversationEvent(
      attachment.message.conversation_id,
      'message:attachment',
      { message_id: attachment.message_id },
    );
    return { removed: true };
  }
}

function isMissingFile(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'ENOENT'
  );
}

function typeForMime(
  mimeType: string,
): 'image' | 'video' | 'audio' | 'document' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
}
