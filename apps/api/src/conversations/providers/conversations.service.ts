import { Injectable, NotFoundException } from '@nestjs/common';
import type { UpdateConversationDto } from '@repo/shared';

import { ConversationAccessService } from '@/common/providers/conversation-access.service';
import { PrismaService } from '@/prisma.service';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ConversationAccessService,
  ) {}

  async list(
    userId: string,
    page: number,
    limit: number,
    archived: boolean,
    starred: boolean,
  ) {
    const where = {
      members: {
        some: {
          user_id: userId,
          left_at: null,
          archived_at: archived ? { not: null } : null,
          ...(starred ? { starred_at: { not: null } } : {}),
        },
      },
      deleted_at: null,
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.conversation.findMany({
        where,
        include: {
          members: {
            where: { left_at: null },
            select: {
              user_id: true,
              role: true,
              archived_at: true,
              starred_at: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatar_url: true,
                },
              },
            },
          },
          messages: {
            where: {
              deleted_at: null,
              OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
            },
            orderBy: { created_at: 'desc' },
            take: 1,
            select: {
              id: true,
              sender_id: true,
              type: true,
              content: true,
              created_at: true,
            },
          },
        },
        orderBy: [{ last_message_at: 'desc' }, { created_at: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.conversation.count({ where }),
    ]);
    return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  async get(userId: string, conversationId: string) {
    await this.access.requireMember(conversationId, userId);
    return this.prisma.conversation.findFirstOrThrow({
      where: { id: conversationId, deleted_at: null },
      include: {
        group: true,
        private_conversation: true,
        members: {
          where: { left_at: null },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar_url: true,
              },
            },
          },
        },
      },
    });
  }

  async update(
    userId: string,
    conversationId: string,
    data: UpdateConversationDto,
  ) {
    await this.access.requireAdmin(conversationId, userId);
    return this.prisma.conversation.update({
      where: { id: conversationId },
      data,
    });
  }

  async leave(userId: string, conversationId: string) {
    const membership = await this.access.requireMember(conversationId, userId);
    const conversation = await this.prisma.conversation.findUniqueOrThrow({
      where: { id: conversationId },
      select: { type: true },
    });
    if (conversation.type === 'private') {
      await this.archive(userId, conversationId, true);
      return { left: false, archived: true };
    }
    const now = new Date();
    const memberCount = await this.prisma.conversationMember.count({
      where: { conversation_id: conversationId, left_at: null },
    });
    await this.prisma.$transaction(async (transaction) => {
      await transaction.conversationMember.update({
        where: {
          conversation_id_user_id: {
            conversation_id: conversationId,
            user_id: userId,
          },
        },
        data: { left_at: now },
      });
      if (memberCount === 1) {
        await transaction.conversation.update({
          where: { id: conversationId },
          data: { deleted_at: now },
        });
      } else if (membership.role === 'admin') {
        const nextAdmin = await transaction.conversationMember.findFirst({
          where: {
            conversation_id: conversationId,
            user_id: { not: userId },
            left_at: null,
          },
          orderBy: { joined_at: 'asc' },
          select: { user_id: true },
        });
        if (nextAdmin) {
          await transaction.conversationMember.update({
            where: {
              conversation_id_user_id: {
                conversation_id: conversationId,
                user_id: nextAdmin.user_id,
              },
            },
            data: { role: 'admin' },
          });
        }
      }
    });
    return { left: true, wasAdmin: membership.role === 'admin' };
  }

  async archive(userId: string, conversationId: string, archived: boolean) {
    await this.access.requireMember(conversationId, userId);
    return this.prisma.conversationMember.update({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId,
        },
      },
      data: { archived_at: archived ? new Date() : null },
    });
  }

  async star(userId: string, conversationId: string, starred: boolean) {
    await this.access.requireMember(conversationId, userId);
    return this.prisma.conversationMember.update({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId,
        },
      },
      data: { starred_at: starred ? new Date() : null },
    });
  }

  async ensureActive(conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, deleted_at: null },
      select: { id: true },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
  }
}
