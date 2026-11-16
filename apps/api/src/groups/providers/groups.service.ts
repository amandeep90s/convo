import { randomUUID } from 'node:crypto';

import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateGroupDto, UpdateGroupDto } from '@repo/shared';

import { ConversationAccessService } from '@/common/providers/conversation-access.service';
import { PrismaService } from '@/prisma.service';

@Injectable()
export class GroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ConversationAccessService,
  ) {}

  async list(
    userId: string,
    page: number,
    limit: number,
    type: 'group' | 'community' = 'group',
  ) {
    const where = {
      conversation: {
        type,
        deleted_at: null,
        members: { some: { user_id: userId, left_at: null } },
      },
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.group.findMany({
        where,
        include: {
          conversation: {
            select: {
              id: true,
              name: true,
              avatar_url: true,
              members: { where: { user_id: userId }, take: 1 },
            },
          },
        },
        orderBy: { updated_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.group.count({ where }),
    ]);
    return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  async create(
    userId: string,
    data: CreateGroupDto,
    type: 'group' | 'community' = 'group',
  ) {
    const conversationId = randomUUID();
    return this.prisma.$transaction(async (transaction) => {
      await transaction.conversation.create({
        data: {
          id: conversationId,
          type,
          name: data.name,
          avatar_url: data.avatar_url,
          created_by: userId,
          members: { create: { user_id: userId, role: 'admin' } },
        },
      });
      return transaction.group.create({
        data: {
          conversation_id: conversationId,
          created_by: userId,
          description: data.description,
        },
        include: { conversation: { include: { members: true } } },
      });
    });
  }

  async get(
    userId: string,
    conversationId: string,
    type: 'group' | 'community' = 'group',
  ) {
    await this.access.requireMember(conversationId, userId);
    const group = await this.prisma.group.findFirst({
      where: {
        conversation_id: conversationId,
        conversation: { type, deleted_at: null },
      },
      include: {
        conversation: {
          include: {
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
        },
      },
    });
    if (!group)
      throw new NotFoundException(
        type === 'group' ? 'Group not found' : 'Community not found',
      );
    return group;
  }

  async update(
    userId: string,
    conversationId: string,
    data: UpdateGroupDto,
    type: 'group' | 'community' = 'group',
  ) {
    await this.access.requireAdmin(conversationId, userId);
    await this.get(userId, conversationId, type);
    const result = await this.prisma.group.updateMany({
      where: { conversation_id: conversationId },
      data: { description: data.description },
    });
    if (!result.count) throw new NotFoundException('Group not found');
    if (data.name !== undefined || data.avatar_url !== undefined) {
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { name: data.name, avatar_url: data.avatar_url },
      });
    }
    return this.get(userId, conversationId, type);
  }

  async remove(
    userId: string,
    conversationId: string,
    type: 'group' | 'community' = 'group',
  ) {
    await this.access.requireAdmin(conversationId, userId);
    await this.get(userId, conversationId, type);
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { deleted_at: new Date() },
    });
    return { deleted: true };
  }
}
