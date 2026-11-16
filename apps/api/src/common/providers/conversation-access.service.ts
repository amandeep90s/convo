import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/prisma.service';

@Injectable()
export class ConversationAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async requireMember(conversationId: string, userId: string) {
    const membership = await this.prisma.conversationMember.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId,
        },
      },
      include: { conversation: { select: { deleted_at: true } } },
    });
    if (
      !membership ||
      membership.left_at ||
      membership.conversation.deleted_at
    ) {
      throw new NotFoundException('Conversation not found');
    }
    return membership;
  }

  async requireAdmin(conversationId: string, userId: string) {
    const member = await this.requireMember(conversationId, userId);
    if (member.role !== 'admin') {
      throw new ForbiddenException('Conversation admin permission is required');
    }
    return member;
  }

  async assertNotBlocked(userId: string, otherUserId: string) {
    const blocked = await this.prisma.blockedUser.findFirst({
      where: {
        OR: [
          { user_id: userId, blocked_user_id: otherUserId },
          { user_id: otherUserId, blocked_user_id: userId },
        ],
      },
      select: { user_id: true },
    });
    if (blocked) throw new ForbiddenException('This user cannot be contacted');
  }
}
