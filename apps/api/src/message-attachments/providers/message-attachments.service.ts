import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { access as accessFile } from 'node:fs/promises';
import path from 'node:path';

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { removeMessageFiles } from '@/common/message-files';
import { ConversationAccessService } from '@/common/providers/conversation-access.service';
import {
  MessagesService,
  type StoredMessageAttachment,
} from '@/messages/providers/messages.service';
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
    private readonly messages: MessagesService,
  ) {
    this.uploadDir = this.configService.getOrThrow<string>('app.uploadDir');
  }

  async list(userId: string, messageId: string) {
    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        deleted_at: null,
        hidden_for: { none: { user_id: userId } },
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

    const stored = await this.storeFile(file);
    const attachment = await this.prisma
      .$transaction(async (transaction) => {
        await transaction.conversation.update({
          where: { id: message.conversation_id },
          data: { updated_at: new Date() },
        });
        const active = await transaction.message.findFirst({
          where: {
            id: messageId,
            deleted_at: null,
            conversation: { deleted_at: null },
          },
          select: { id: true },
        });
        if (!active) throw new NotFoundException('Message not found');
        return transaction.messageAttachment.create({
          data: { message_id: messageId, ...stored },
          select: {
            id: true,
            message_id: true,
            type: true,
            mime_type: true,
            file_name: true,
            file_size: true,
            created_at: true,
          },
        });
      })
      .catch(async (error: unknown) => {
        await removeMessageFiles(this.uploadDir, [stored.storage_key]);
        throw error;
      });
    await this.realtime.emitConversationEvent(
      message.conversation_id,
      'message:attachment',
      { message_id: messageId },
    );
    return { ...attachment, file_size: Number(attachment.file_size) };
  }

  async uploadToConversation(
    userId: string,
    conversationId: string,
    file: UploadedMessageFile,
  ) {
    await this.access.requireMember(conversationId, userId);
    const stored = await this.storeFile(file);
    return this.messages.create(
      userId,
      {
        conversation_id: conversationId,
        type: stored.type,
        content: stored.file_name ?? undefined,
      },
      stored,
    );
  }

  private async storeFile(
    file: UploadedMessageFile,
  ): Promise<StoredMessageAttachment> {
    if (!this.allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException('Unsupported file type');
    }
    if (file.size < 1 || file.size > 20 * 1024 * 1024) {
      throw new BadRequestException('Files must be between 1 byte and 20 MB');
    }
    await mkdir(this.uploadDir, { recursive: true });
    const extension = path
      .extname(path.basename(file.originalname))
      .slice(0, 12);
    const storageKey = `${randomUUID()}${extension}`;
    try {
      await writeFile(path.join(this.uploadDir, storageKey), file.buffer, {
        flag: 'wx',
      });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code !== 'EEXIST'
      ) {
        await removeMessageFiles(this.uploadDir, [storageKey]);
      }
      throw error;
    }
    return {
      type: typeForMime(file.mimetype),
      storage_key: storageKey,
      mime_type: file.mimetype,
      file_name: path.basename(file.originalname).slice(0, 255),
      file_size: BigInt(file.size),
    };
  }

  async download(userId: string, attachmentId: string) {
    const attachment = await this.prisma.messageAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        message: {
          select: {
            conversation_id: true,
            deleted_at: true,
            expires_at: true,
            hidden_for: {
              where: { user_id: userId },
              select: { user_id: true },
            },
          },
        },
      },
    });
    if (
      !attachment ||
      attachment.message.deleted_at ||
      attachment.message.hidden_for.length > 0 ||
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
    await removeMessageFiles(this.uploadDir, [
      attachment.storage_key,
      attachment.thumbnail_key,
    ]);
    await this.prisma.messageAttachment.deleteMany({
      where: { id: attachmentId },
    });
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
