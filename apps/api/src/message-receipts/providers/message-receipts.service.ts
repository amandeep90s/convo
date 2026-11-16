import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ConversationAccessService } from '@/common/providers/conversation-access.service';
import { PrismaService } from '@/prisma.service';
import { RealtimeGateway } from '@/realtime/realtime.gateway';

@Injectable()
export class MessageReceiptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ConversationAccessService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async list(userId: string, conversationId: string) {
    await this.access.requireMember(conversationId, userId);
    return this.prisma.messageReceipt.findMany({
      where: {
        message: {
          conversation_id: conversationId,
          sender_id: userId,
          deleted_at: null,
          OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
        },
      },
      include: {
        user: { select: { id: true, username: true, name: true } },
        message: { select: { id: true } },
      },
      orderBy: [{ read_at: 'desc' }, { delivered_at: 'desc' }],
    });
  }

  async delivered(userId: string, messageId: string) {
    const message = await this.messageForReceipt(userId, messageId);
    if (message.sender_id === userId)
      throw new ConflictException('Cannot receipt your own message');
    const now = new Date();
    const receipt = await this.prisma.messageReceipt.upsert({
      where: { message_id_user_id: { message_id: messageId, user_id: userId } },
      create: { message_id: messageId, user_id: userId, delivered_at: now },
      update: { delivered_at: now },
    });
    this.realtime.emitConversationEvent(
      message.conversation_id,
      'message:receipt',
      receipt,
    );
    return receipt;
  }

  async read(userId: string, messageId: string) {
    const message = await this.messageForReceipt(userId, messageId);
    if (message.sender_id === userId)
      throw new ConflictException('Cannot receipt your own message');
    const settings = await this.prisma.userSettings.findUnique({
      where: { user_id: userId },
      select: { read_receipts: true },
    });
    const now = new Date();
    const receipt = await this.prisma.messageReceipt.upsert({
      where: { message_id_user_id: { message_id: messageId, user_id: userId } },
      create: {
        message_id: messageId,
        user_id: userId,
        delivered_at: now,
        read_at: settings?.read_receipts === false ? null : now,
      },
      update: {
        delivered_at: now,
        ...(settings?.read_receipts === false ? {} : { read_at: now }),
      },
    });
    await this.prisma.conversationMember.update({
      where: {
        conversation_id_user_id: {
          conversation_id: message.conversation_id,
          user_id: userId,
        },
      },
      data: { last_read_message_id: messageId },
    });
    if (settings?.read_receipts !== false) {
      this.realtime.emitConversationEvent(
        message.conversation_id,
        'message:receipt',
        receipt,
      );
    }
    return { read: true };
  }

  private async messageForReceipt(userId: string, messageId: string) {
    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        deleted_at: null,
        OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
      },
      select: { id: true, sender_id: true, conversation_id: true },
    });
    if (!message) throw new NotFoundException('Message not found');
    await this.access.requireMember(message.conversation_id, userId);
    return message;
  }
}
