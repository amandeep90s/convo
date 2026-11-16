import { randomUUID } from 'node:crypto';

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ConversationAccessService } from '@/common/providers/conversation-access.service';
import { PrismaService } from '@/prisma.service';

@Injectable()
export class PrivateConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ConversationAccessService,
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
    const [userA, userB] = [userId, participantId].sort();
    const pairKey = `${userA}:${userB}`;
    const existing = await this.prisma.privateConversation.findUnique({
      where: { pair_key: pairKey },
      select: { conversation_id: true },
    });
    if (existing) return this.get(userId, existing.conversation_id);

    const conversationId = randomUUID();
    try {
      await this.prisma.$transaction(async (transaction) => {
        await transaction.conversation.create({
          data: {
            id: conversationId,
            type: 'private',
            created_by: userId,
            members: {
              create: [
                { user_id: userId, role: 'admin' },
                { user_id: participantId, role: 'member' },
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
      return this.get(userId, winner.conversation_id);
    }
    return this.get(userId, conversationId);
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
