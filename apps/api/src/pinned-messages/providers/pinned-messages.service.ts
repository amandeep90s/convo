import { Injectable, NotFoundException } from '@nestjs/common';

import { ConversationAccessService } from '@/common/providers/conversation-access.service';
import { PrismaService } from '@/prisma.service';
import { RealtimeGateway } from '@/realtime/realtime.gateway';

@Injectable()
export class PinnedMessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ConversationAccessService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async list(userId: string, conversationId: string) {
    await this.access.requireMember(conversationId, userId);
    return this.prisma.pinnedMessage.findMany({
      where: {
        conversation_id: conversationId,
        message: {
          deleted_at: null,
          hidden_for: { none: { user_id: userId } },
          OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
        },
      },
      include: {
        message: {
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar_url: true,
              },
            },
          },
        },
        pinner: { select: { id: true, username: true, name: true } },
      },
      orderBy: { pinned_at: 'desc' },
    });
  }

  async pin(userId: string, messageId: string) {
    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        deleted_at: null,
        hidden_for: { none: { user_id: userId } },
        OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
      },
      select: { id: true, conversation_id: true },
    });
    if (!message) throw new NotFoundException('Message not found');
    await this.access.requireMember(message.conversation_id, userId);
    const pin = await this.prisma.pinnedMessage.upsert({
      where: {
        conversation_id_message_id: {
          conversation_id: message.conversation_id,
          message_id: messageId,
        },
      },
      create: {
        conversation_id: message.conversation_id,
        message_id: messageId,
        pinned_by: userId,
      },
      update: { pinned_by: userId, pinned_at: new Date() },
      include: { message: true },
    });
    await this.realtime.emitConversationEvent(
      message.conversation_id,
      'message:pinned',
      { id: messageId },
    );
    return pin;
  }

  async unpin(userId: string, messageId: string) {
    const pin = await this.prisma.pinnedMessage.findFirst({
      where: { message_id: messageId },
      select: { conversation_id: true },
    });
    if (!pin) throw new NotFoundException('Pinned message not found');
    await this.access.requireMember(pin.conversation_id, userId);
    await this.prisma.pinnedMessage.delete({
      where: {
        conversation_id_message_id: {
          conversation_id: pin.conversation_id,
          message_id: messageId,
        },
      },
    });
    await this.realtime.emitConversationEvent(
      pin.conversation_id,
      'message:pinned',
      { id: messageId },
    );
    return { unpinned: true };
  }
}
