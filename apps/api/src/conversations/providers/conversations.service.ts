import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@repo/db';
import type { UpdateConversationDto } from '@repo/shared';

import { ConversationAccessService } from '@/common/providers/conversation-access.service';
import { PrismaService } from '@/prisma.service';
import { RealtimeGateway } from '@/realtime/realtime.gateway';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ConversationAccessService,
    private readonly realtime: RealtimeGateway,
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
    const conversationIds = data.map(({ id }) => id);
    const [presence, unread] = await Promise.all([
      this.realtime.presenceFor(
        userId,
        data
          .filter(({ type }) => type === 'private')
          .flatMap(({ members }) =>
            members
              .filter((member) => member.user_id !== userId)
              .map((member) => member.user_id),
          ),
      ),
      conversationIds.length
        ? this.prisma.$queryRaw<
            Array<{ conversation_id: string; unread_count: bigint }>
          >(Prisma.sql`
        SELECT message.conversation_id, COUNT(*) AS unread_count
        FROM messages AS message
        JOIN conversation_members AS member
          ON member.conversation_id = message.conversation_id AND member.user_id = ${userId}::uuid
        LEFT JOIN messages AS read_cursor ON read_cursor.id = member.last_read_message_id
        WHERE message.conversation_id IN (${Prisma.join(conversationIds.map((id) => Prisma.sql`${id}::uuid`))})
          AND member.left_at IS NULL
          AND message.sender_id <> ${userId}::uuid
          AND message.deleted_at IS NULL
          AND (message.expires_at IS NULL OR message.expires_at > NOW())
          AND message.created_at >= member.joined_at
          AND (read_cursor.id IS NULL OR (message.created_at, message.id) > (read_cursor.created_at, read_cursor.id))
        GROUP BY message.conversation_id
      `)
        : Promise.resolve([]),
    ]);
    const unreadCounts = new Map(
      unread.map((entry): [string, number] => [
        entry.conversation_id,
        Number(entry.unread_count),
      ]),
    );
    return {
      data: data.map((conversation) => ({
        ...conversation,
        unread_count: unreadCounts.get(conversation.id) ?? 0,
        members: conversation.members.map((member) => ({
          ...member,
          user: {
            ...member.user,
            presence: presence.get(member.user_id) ?? null,
          },
        })),
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async get(userId: string, conversationId: string) {
    await this.access.requireMember(conversationId, userId);
    const conversation = await this.prisma.conversation.findFirstOrThrow({
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
    const presence = await this.realtime.presenceFor(
      userId,
      conversation.type === 'private'
        ? conversation.members
            .filter((member) => member.user_id !== userId)
            .map((member) => member.user_id)
        : [],
    );
    return {
      ...conversation,
      members: conversation.members.map((member) => ({
        ...member,
        user: {
          ...member.user,
          presence: presence.get(member.user_id) ?? null,
        },
      })),
    };
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
