import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@repo/db';
import type {
  CreateMessageDto,
  DeleteMessageParams,
  SearchMessagesParams,
  UpdateMessageDto,
} from '@repo/shared';
import { MESSAGE_EDIT_WINDOW_MS } from '@repo/shared';

import { removeMessageFiles } from '@/common/message-files';
import { ConversationAccessService } from '@/common/providers/conversation-access.service';
import { PrismaService } from '@/prisma.service';
import { RealtimeGateway } from '@/realtime/realtime.gateway';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ConversationAccessService,
    private readonly realtime: RealtimeGateway,
    private readonly config: ConfigService,
  ) {}

  async list(
    userId: string,
    conversationId: string,
    cursor: string | undefined,
    limit: number,
  ) {
    await this.access.requireMember(conversationId, userId);
    const take = boundedLimit(limit);
    const now = new Date();
    if (cursor) {
      const cursorMessage = await this.prisma.message.findFirst({
        where: { id: cursor, conversation_id: conversationId },
        select: { id: true },
      });
      if (!cursorMessage)
        throw new BadRequestException('Invalid message cursor');
    }
    const messages = await this.prisma.message.findMany({
      where: {
        conversation_id: conversationId,
        deleted_at: null,
        hidden_for: { none: { user_id: userId } },
        OR: [{ expires_at: null }, { expires_at: { gt: now } }],
      },
      include: {
        sender: {
          select: { id: true, username: true, name: true, avatar_url: true },
        },
        attachments: true,
        reactions: true,
        receipts: true,
      },
      orderBy: { created_at: 'desc' },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: take + 1,
    });
    const hasMore = messages.length > take;
    const items = messages.slice(0, take).map(serializeMessage);
    return {
      items,
      nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
      hasMore,
    };
  }

  async search(userId: string, params: SearchMessagesParams) {
    const {
      q,
      conversationId,
      sender,
      from,
      to,
      attachmentType,
      page = 1,
      limit = 20,
    } = params;
    const membership = { some: { user_id: userId, left_at: null } };
    if (conversationId) await this.access.requireMember(conversationId, userId);
    const boundedPageSize = boundedLimit(limit);
    const where = {
      content: { contains: q, mode: 'insensitive' as const },
      deleted_at: null,
      hidden_for: { none: { user_id: userId } },
      OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
      ...(conversationId ? { conversation_id: conversationId } : {}),
      ...(sender
        ? {
            sender: {
              is: {
                OR: [
                  { name: { contains: sender, mode: 'insensitive' as const } },
                  {
                    username: {
                      contains: sender,
                      mode: 'insensitive' as const,
                    },
                  },
                ],
              },
            },
          }
        : {}),
      ...(from || to
        ? {
            created_at: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
      ...(attachmentType
        ? { attachments: { some: { type: attachmentType } } }
        : {}),
      conversation: { deleted_at: null, members: membership },
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.message.findMany({
        where,
        select: {
          id: true,
          conversation_id: true,
          sender_id: true,
          type: true,
          content: true,
          created_at: true,
          sender: {
            select: { id: true, username: true, name: true, avatar_url: true },
          },
          conversation: { select: { id: true, name: true, type: true } },
          attachments: {
            select: { id: true, type: true, file_name: true, mime_type: true },
          },
        },
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * boundedPageSize,
        take: boundedPageSize,
      }),
      this.prisma.message.count({ where }),
    ]);
    return {
      data,
      page,
      limit: boundedPageSize,
      total,
      totalPages: Math.ceil(total / boundedPageSize),
    };
  }

  async get(userId: string, messageId: string) {
    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        deleted_at: null,
        hidden_for: { none: { user_id: userId } },
        OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
      },
      include: {
        sender: {
          select: { id: true, username: true, name: true, avatar_url: true },
        },
        attachments: true,
        reactions: true,
        receipts: true,
      },
    });
    if (!message) throw new NotFoundException('Message not found');
    await this.access.requireMember(message.conversation_id, userId);
    return serializeMessage(message);
  }

  async create(userId: string, data: CreateMessageDto) {
    const membership = await this.access.requireMember(
      data.conversation_id,
      userId,
    );
    if (data.type === 'text' && !data.content?.trim()) {
      throw new BadRequestException('Text messages must include content');
    }
    if (data.expires_at && data.expires_at <= new Date()) {
      throw new BadRequestException('Message expiration must be in the future');
    }
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: data.conversation_id, deleted_at: null },
      select: {
        type: true,
        members: {
          where: { user_id: { not: userId }, left_at: null },
          select: {
            user_id: true,
            muted_until: true,
            notification_policy: true,
            user: {
              select: {
                settings: { select: { notification_enabled: true } },
              },
            },
          },
        },
      },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.type === 'private' && conversation.members[0]) {
      await this.access.assertNotBlocked(
        userId,
        conversation.members[0].user_id,
      );
    }
    if (data.reply_to_id) {
      const replyTo = await this.prisma.message.findFirst({
        where: {
          id: data.reply_to_id,
          conversation_id: data.conversation_id,
          deleted_at: null,
          hidden_for: { none: { user_id: userId } },
          OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
        },
        select: { id: true },
      });
      if (!replyTo) throw new NotFoundException('Reply target not found');
    }
    if (membership.left_at)
      throw new ForbiddenException('You are no longer a member');

    const message = await this.prisma.$transaction(async (transaction) => {
      const active = await transaction.conversation.updateMany({
        where: { id: data.conversation_id, deleted_at: null },
        data: { updated_at: new Date() },
      });
      if (!active.count) throw new NotFoundException('Conversation not found');
      const created = await transaction.message.create({
        data: {
          conversation_id: data.conversation_id,
          sender_id: userId,
          reply_to_id: data.reply_to_id,
          type: data.type,
          content: data.content,
          metadata: data.metadata,
          expires_at: data.expires_at,
        },
        include: {
          sender: {
            select: { id: true, username: true, name: true, avatar_url: true },
          },
          attachments: true,
          reactions: true,
          receipts: true,
        },
      });
      await transaction.conversation.update({
        where: { id: data.conversation_id },
        data: {
          last_message_id: created.id,
          last_message_at: created.created_at,
        },
      });
      const recipients = await transaction.conversationMember.findMany({
        where: {
          conversation_id: data.conversation_id,
          user_id: { not: userId },
          left_at: null,
        },
        select: { user_id: true },
      });
      if (recipients.length) {
        await transaction.messageReceipt.createMany({
          data: recipients.map(({ user_id }) => ({
            message_id: created.id,
            user_id,
          })),
        });
      }
      await transaction.conversationMember.update({
        where: {
          conversation_id_user_id: {
            conversation_id: data.conversation_id,
            user_id: userId,
          },
        },
        data: { last_read_message_id: created.id },
      });
      return created;
    });
    const response = serializeMessage(message);
    await this.realtime.emitConversationEvent(
      data.conversation_id,
      'message:created',
      response,
    );
    for (const member of conversation.members) {
      if (
        member.user.settings?.notification_enabled !== false &&
        member.notification_policy === 'all' &&
        (!member.muted_until || member.muted_until <= new Date())
      ) {
        this.realtime.emitUserEvent(
          member.user_id,
          'message:notification',
          response,
        );
      }
    }
    return response;
  }

  async update(userId: string, messageId: string, data: UpdateMessageDto) {
    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        deleted_at: null,
        hidden_for: { none: { user_id: userId } },
        OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
      },
      select: {
        id: true,
        sender_id: true,
        conversation_id: true,
        created_at: true,
        type: true,
      },
    });
    if (!message) throw new NotFoundException('Message not found');
    await this.access.requireMember(message.conversation_id, userId);
    if (message.sender_id !== userId)
      throw new ForbiddenException('Only the sender can edit this message');
    if (message.type !== 'text')
      throw new ForbiddenException('Only text messages can be edited');
    const now = new Date();
    const result = await this.prisma.message.updateMany({
      where: {
        id: messageId,
        sender_id: userId,
        type: 'text',
        deleted_at: null,
        conversation: { deleted_at: null },
        hidden_for: { none: { user_id: userId } },
        created_at: { gt: new Date(now.getTime() - MESSAGE_EDIT_WINDOW_MS) },
        OR: [{ expires_at: null }, { expires_at: { gt: now } }],
      },
      data: { content: data.content, edited_at: now },
    });
    if (!result.count)
      throw new ForbiddenException(
        'Messages can only be edited within 15 minutes of sending',
      );
    const updated = await this.prisma.message.findUniqueOrThrow({
      where: { id: messageId },
      include: {
        sender: {
          select: { id: true, username: true, name: true, avatar_url: true },
        },
      },
    });
    await this.realtime.emitConversationEvent(
      message.conversation_id,
      'message:updated',
      updated,
    );
    return updated;
  }

  async remove(
    userId: string,
    messageId: string,
    scope: DeleteMessageParams['scope'] = 'everyone',
  ) {
    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        ...(scope === 'me'
          ? {
              deleted_at: null,
              OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
            }
          : {}),
      },
      include: { conversation: { select: { id: true, type: true } } },
    });
    if (!message) throw new NotFoundException('Message not found');
    const membership = await this.access.requireMember(
      message.conversation_id,
      userId,
    );
    if (scope === 'me') {
      await this.prisma.hiddenMessage.upsert({
        where: {
          message_id_user_id: { message_id: messageId, user_id: userId },
        },
        create: { message_id: messageId, user_id: userId },
        update: {},
      });
      this.realtime.emitUserEvent(userId, 'message:deleted', {
        id: messageId,
        conversation_id: message.conversation_id,
      });
      return { deleted: true };
    }
    if (
      message.sender_id !== userId &&
      !(message.conversation.type !== 'private' && membership.role === 'admin')
    ) {
      throw new ForbiddenException('You cannot delete this message');
    }
    const deletionKind =
      message.sender_id === userId ? 'sender' : 'group_admin';
    // Keep a redacted tombstone until file cleanup succeeds, so failures can be retried.
    await this.prisma.$transaction(async (transaction) => {
      await transaction.conversation.update({
        where: { id: message.conversation_id },
        data: { updated_at: new Date() },
      });
      await transaction.message.updateMany({
        where: { id: messageId, deleted_at: null },
        data: {
          content: null,
          metadata: Prisma.DbNull,
          deleted_at: new Date(),
          deleted_by_id: userId,
          deletion_kind: deletionKind,
        },
      });
    });
    await this.realtime.emitConversationEvent(
      message.conversation_id,
      'message:deleted',
      { id: messageId },
    );
    const attachments = await this.prisma.messageAttachment.findMany({
      where: { message_id: messageId },
      select: { storage_key: true, thumbnail_key: true },
    });
    await removeMessageFiles(
      this.config.getOrThrow<string>('app.uploadDir'),
      attachments.flatMap(({ storage_key, thumbnail_key }) => [
        storage_key,
        thumbnail_key,
      ]),
    );
    await this.prisma.$transaction(async (transaction) => {
      await transaction.conversation.update({
        where: { id: message.conversation_id },
        data: { updated_at: new Date() },
      });
      const previous = await transaction.message.findFirst({
        where: {
          conversation_id: message.conversation_id,
          OR: [
            { created_at: { lt: message.created_at } },
            { created_at: message.created_at, id: { lt: messageId } },
          ],
        },
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        select: { id: true },
      });
      await transaction.conversationMember.updateMany({
        where: {
          conversation_id: message.conversation_id,
          last_read_message_id: messageId,
        },
        data: { last_read_message_id: previous?.id ?? null },
      });
      await transaction.message.deleteMany({ where: { id: messageId } });
      const latest = await transaction.message.findFirst({
        where: {
          conversation_id: message.conversation_id,
          deleted_at: null,
          OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
        },
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        select: { id: true, created_at: true },
      });
      await transaction.conversation.update({
        where: { id: message.conversation_id },
        data: {
          last_message_id: latest?.id ?? null,
          last_message_at: latest?.created_at ?? null,
        },
      });
    });
    await this.realtime.emitConversationEvent(
      message.conversation_id,
      'message:deleted',
      { id: messageId },
    );
    return { deleted: true };
  }
}

function boundedLimit(value: number): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new BadRequestException('Limit must be a positive integer');
  }
  return Math.min(value, 100);
}

function serializeMessage<
  T extends {
    attachments: Array<{
      file_size: bigint | null;
      duration_ms: bigint | null;
    }>;
  },
>(message: T) {
  return {
    ...message,
    attachments: message.attachments.map((attachment) => ({
      ...attachment,
      file_size:
        attachment.file_size === null ? null : Number(attachment.file_size),
      duration_ms:
        attachment.duration_ms === null ? null : Number(attachment.duration_ms),
    })),
  };
}
