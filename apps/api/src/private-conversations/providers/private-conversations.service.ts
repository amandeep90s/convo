import { randomUUID } from 'node:crypto';

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ConversationAccessService } from '@/common/providers/conversation-access.service';
import { PrismaService } from '@/prisma.service';
import { RealtimeGateway } from '@/realtime/realtime.gateway';

@Injectable()
export class PrivateConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ConversationAccessService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async create(userId: string, participantId: string) {
    if (userId === participantId)
      throw new ConflictException('Cannot start a conversation with yourself');
    await this.access.assertNotBlocked(userId, participantId);
    const participant = await this.prisma.user.findFirst({
      where: { id: participantId, status: 'active', deleted_at: null },
      select: { id: true },
    });
    if (!participant) throw new NotFoundException('User not found');
    return this.openPair(userId, participantId);
  }

  async saved(userId: string) {
    return this.openPair(userId, userId);
  }

  private async getPair(
    userId: string,
    participantId: string,
    conversationId: string,
  ) {
    if (userId === participantId) {
      await this.prisma.conversationMember.update({
        where: {
          conversation_id_user_id: {
            conversation_id: conversationId,
            user_id: userId,
          },
        },
        data: { left_at: null, archived_at: null },
      });
    }
    return this.get(userId, conversationId);
  }

  private async openPair(userId: string, participantId: string) {
    const [userA, userB] = [userId, participantId].sort();
    const pairKey = `${userA}:${userB}`;
    const existing = await this.prisma.privateConversation.findUnique({
      where: { pair_key: pairKey },
      select: { conversation_id: true },
    });
    if (existing)
      return this.getPair(userId, participantId, existing.conversation_id);

    const conversationId = randomUUID();
    try {
      await this.prisma.$transaction(async (transaction) => {
        await transaction.conversation.create({
          data: {
            id: conversationId,
            type: 'private',
            ...(userId === participantId ? { name: 'Saved Messages' } : {}),
            created_by: userId,
            members: {
              create: [
                { user_id: userId, role: 'admin' },
                ...(participantId === userId
                  ? []
                  : [{ user_id: participantId, role: 'member' as const }]),
              ],
            },
          },
        });
        await transaction.privateConversation.create({
          data: {
            conversation_id: conversationId,
            user_a_id: userA,
            user_b_id: userB,
            pair_key: pairKey,
          },
        });
      });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      const winner = await this.prisma.privateConversation.findUnique({
        where: { pair_key: pairKey },
        select: { conversation_id: true },
      });
      if (!winner) throw error;
      return this.getPair(userId, participantId, winner.conversation_id);
    }
    await this.realtime.emitConversationEvent(
      conversationId,
      'conversation:updated',
      {},
    );
    return this.getPair(userId, participantId, conversationId);
  }

  async get(userId: string, conversationId: string) {
    await this.access.requireMember(conversationId, userId);
    const conversation = await this.prisma.privateConversation.findUnique({
      where: { conversation_id: conversationId },
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
    if (!conversation)
      throw new NotFoundException('Private conversation not found');
    return conversation;
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}
