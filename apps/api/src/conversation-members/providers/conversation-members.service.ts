import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateConversationMemberDto,
  UpdateConversationMemberDto,
} from '@repo/shared';

import { ConversationAccessService } from '@/common/providers/conversation-access.service';
import { PrismaService } from '@/prisma.service';

@Injectable()
export class ConversationMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ConversationAccessService,
  ) {}

  async list(
    userId: string,
    conversationId: string,
    page: number,
    limit: number,
  ) {
    await this.access.requireMember(conversationId, userId);
    const where = { conversation_id: conversationId, left_at: null };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.conversationMember.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              about: true,
              avatar_url: true,
            },
          },
        },
        orderBy: [{ role: 'asc' }, { joined_at: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.conversationMember.count({ where }),
    ]);
    return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  async add(
    userId: string,
    conversationId: string,
    data: CreateConversationMemberDto,
  ) {
    await this.access.requireAdmin(conversationId, userId);
    await this.access.assertNotBlocked(userId, data.user_id);
    const target = await this.prisma.user.findFirst({
      where: { id: data.user_id, status: 'active', deleted_at: null },
      select: { id: true },
    });
    if (!target) throw new NotFoundException('User not found');
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, deleted_at: null },
      select: { type: true },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.type === 'private') {
      throw new ForbiddenException(
        'Private conversations cannot have additional members',
      );
    }

    return this.prisma.conversationMember.upsert({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: data.user_id,
        },
      },
      create: {
        conversation_id: conversationId,
        user_id: data.user_id,
        role: data.role ?? 'member',
      },
      update: {
        role: data.role ?? 'member',
        joined_at: new Date(),
        left_at: null,
      },
      include: {
        user: {
          select: { id: true, username: true, name: true, avatar_url: true },
        },
      },
    });
  }

  async update(
    userId: string,
    conversationId: string,
    targetUserId: string,
    data: UpdateConversationMemberDto,
  ) {
    const currentUserIsTarget = userId === targetUserId;
    if (!currentUserIsTarget || data.role) {
      await this.access.requireAdmin(conversationId, userId);
    } else {
      await this.access.requireMember(conversationId, userId);
    }
    if (data.role === 'member') {
      const target = await this.prisma.conversationMember.findUnique({
        where: {
          conversation_id_user_id: {
            conversation_id: conversationId,
            user_id: targetUserId,
          },
        },
        select: { role: true },
      });
      if (target?.role === 'admin') {
        const adminCount = await this.prisma.conversationMember.count({
          where: {
            conversation_id: conversationId,
            role: 'admin',
            left_at: null,
          },
        });
        if (adminCount <= 1)
          throw new ConflictException(
            'A conversation must have an active admin',
          );
      }
    }
    const result = await this.prisma.conversationMember.updateMany({
      where: {
        conversation_id: conversationId,
        user_id: targetUserId,
        left_at: null,
      },
      data,
    });
    if (!result.count)
      throw new NotFoundException('Conversation member not found');
    return this.prisma.conversationMember.findUniqueOrThrow({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: targetUserId,
        },
      },
    });
  }

  async remove(userId: string, conversationId: string, targetUserId: string) {
    if (userId === targetUserId) {
      await this.access.requireMember(conversationId, userId);
    } else {
      await this.access.requireAdmin(conversationId, userId);
    }
    const target = await this.prisma.conversationMember.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: targetUserId,
        },
      },
      select: { role: true, left_at: true },
    });
    if (!target || target.left_at)
      throw new NotFoundException('Conversation member not found');
    await this.prisma.$transaction(async (transaction) => {
      if (target.role === 'admin') {
        const admins = await transaction.conversationMember.count({
          where: {
            conversation_id: conversationId,
            role: 'admin',
            left_at: null,
          },
        });
        if (admins <= 1) {
          const nextAdmin = await transaction.conversationMember.findFirst({
            where: {
              conversation_id: conversationId,
              user_id: { not: targetUserId },
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
      }
      await transaction.conversationMember.update({
        where: {
          conversation_id_user_id: {
            conversation_id: conversationId,
            user_id: targetUserId,
          },
        },
        data: { left_at: new Date() },
      });
    });
    return { removed: true };
  }
}
