import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateMessageReactionDto } from '@repo/shared';

import { ConversationAccessService } from '@/common/providers/conversation-access.service';
import { PrismaService } from '@/prisma.service';
import { RealtimeGateway } from '@/realtime/realtime.gateway';

@Injectable()
export class MessageReactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ConversationAccessService,
    private readonly realtime: RealtimeGateway,
  ) {}

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
    return this.prisma.messageReaction.findMany({
      where: { message_id: messageId },
      include: {
        user: {
          select: { id: true, username: true, name: true, avatar_url: true },
        },
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async add(userId: string, messageId: string, data: CreateMessageReactionDto) {
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
    const reaction = await this.prisma.messageReaction.upsert({
      where: { message_id_user_id: { message_id: messageId, user_id: userId } },
      create: { message_id: messageId, user_id: userId, emoji: data.emoji },
      update: { emoji: data.emoji, created_at: new Date() },
    });
    await this.realtime.emitConversationEvent(
      message.conversation_id,
      'message:reaction',
      reaction,
    );
    return reaction;
  }

  async remove(userId: string, messageId: string) {
    const message = await this.prisma.message.findFirst({
      where: { id: messageId },
      select: { conversation_id: true },
    });
    if (!message) throw new NotFoundException('Message not found');
    await this.access.requireMember(message.conversation_id, userId);
    const result = await this.prisma.messageReaction.deleteMany({
      where: { message_id: messageId, user_id: userId },
    });
    if (result.count) {
      await this.realtime.emitConversationEvent(
        message.conversation_id,
        'message:reaction',
        { message_id: messageId, user_id: userId },
      );
    }
    return { removed: result.count > 0 };
  }
}
