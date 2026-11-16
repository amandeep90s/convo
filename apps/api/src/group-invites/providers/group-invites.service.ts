import { randomBytes } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CreateGroupInviteDto, UpdateGroupInviteDto } from '@repo/shared';

import { ConversationAccessService } from '@/common/providers/conversation-access.service';
import { PrismaService } from '@/prisma.service';

@Injectable()
export class GroupInvitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ConversationAccessService,
  ) {}

  async create(
    userId: string,
    conversationId: string,
    data: CreateGroupInviteDto,
  ) {
    await this.access.requireAdmin(conversationId, userId);
    if (data.expires_at && data.expires_at <= new Date()) {
      throw new BadRequestException('Invite expiration must be in the future');
    }
    const group = await this.prisma.group.findUnique({
      where: { conversation_id: conversationId },
      select: { conversation_id: true },
    });
    if (!group) throw new NotFoundException('Group not found');
    return this.prisma.groupInvite.create({
      data: {
        conversation_id: conversationId,
        created_by: userId,
        code: randomBytes(24).toString('base64url'),
        expires_at: data.expires_at,
        max_uses: data.max_uses,
      },
    });
  }

  async list(userId: string, conversationId: string) {
    await this.access.requireMember(conversationId, userId);
    return this.prisma.groupInvite.findMany({
      where: { conversation_id: conversationId, revoked_at: null },
      orderBy: { created_at: 'desc' },
    });
  }

  async preview(code: string) {
    const invite = await this.findUsable(code);
    return {
      code: invite.code,
      expires_at: invite.expires_at,
      remaining_uses:
        invite.max_uses === null ? null : invite.max_uses - invite.use_count,
      group: {
        id: invite.group.conversation.id,
        name: invite.group.conversation.name,
        avatar_url: invite.group.conversation.avatar_url,
        description: invite.group.description,
        member_count: invite.group.conversation._count.members,
      },
    };
  }

  async join(userId: string, code: string) {
    const invite = await this.findUsable(code);
    await this.access.assertNotBlocked(userId, invite.created_by);
    return this.prisma.$transaction(async (transaction) => {
      const membership = await transaction.conversationMember.findUnique({
        where: {
          conversation_id_user_id: {
            conversation_id: invite.conversation_id,
            user_id: userId,
          },
        },
      });
      if (membership && !membership.left_at)
        return { joined: true, conversation_id: invite.conversation_id };

      const consumed = await transaction.groupInvite.updateMany({
        where: {
          id: invite.id,
          revoked_at: null,
          use_count: invite.use_count,
          max_uses: invite.max_uses,
          AND: [
            { OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }] },
            ...(invite.max_uses === null
              ? []
              : [{ use_count: { lt: invite.max_uses } }]),
          ],
        },
        data: { use_count: { increment: 1 } },
      });
      if (consumed.count !== 1) {
        throw new ConflictException(
          'Invite is expired, revoked, or has reached its use limit',
        );
      }

      await transaction.conversationMember.upsert({
        where: {
          conversation_id_user_id: {
            conversation_id: invite.conversation_id,
            user_id: userId,
          },
        },
        create: {
          conversation_id: invite.conversation_id,
          user_id: userId,
          role: 'member',
        },
        update: { left_at: null, joined_at: new Date(), role: 'member' },
      });
      return { joined: true, conversation_id: invite.conversation_id };
    });
  }

  async update(userId: string, inviteId: string, data: UpdateGroupInviteDto) {
    const invite = await this.prisma.groupInvite.findUnique({
      where: { id: inviteId },
      select: { id: true, conversation_id: true, created_by: true },
    });
    if (!invite) throw new NotFoundException('Invite not found');
    const member = await this.access.requireMember(
      invite.conversation_id,
      userId,
    );
    if (invite.created_by !== userId && member.role !== 'admin') {
      throw new NotFoundException('Invite not found');
    }
    return this.prisma.groupInvite.update({ where: { id: inviteId }, data });
  }

  async revoke(userId: string, inviteId: string) {
    return this.update(userId, inviteId, { revoked_at: new Date() });
  }

  private async findUsable(code: string) {
    const invite = await this.prisma.groupInvite.findUnique({
      where: { code },
      include: {
        group: {
          include: {
            conversation: {
              select: {
                id: true,
                name: true,
                avatar_url: true,
                deleted_at: true,
                _count: { select: { members: { where: { left_at: null } } } },
              },
            },
          },
        },
      },
    });
    if (
      !invite ||
      invite.revoked_at ||
      invite.group.conversation.deleted_at ||
      (invite.expires_at && invite.expires_at <= new Date()) ||
      (invite.max_uses !== null && invite.use_count >= invite.max_uses)
    ) {
      throw new BadRequestException('Invite is invalid or expired');
    }
    return invite;
  }
}
