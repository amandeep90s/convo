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
          hidden_for: { none: { user_id: userId } },
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
    const existing = await this.prisma.messageReceipt.findUnique({
      where: { message_id_user_id: { message_id: messageId, user_id: userId } },
    });
    if (existing?.delivered_at) return existing;
    const now = new Date();
    const receipt = await this.prisma.messageReceipt.upsert({
      where: { message_id_user_id: { message_id: messageId, user_id: userId } },
      create: { message_id: messageId, user_id: userId, delivered_at: now },
      update: { delivered_at: now },
    });
    await this.realtime.emitConversationEvent(
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
    // History pagination and other devices must not move the read cursor backwards.
    await this.prisma.$executeRaw`
      UPDATE conversation_members AS member
      SET last_read_message_id = ${messageId}::uuid
      WHERE member.conversation_id = ${message.conversation_id}::uuid
        AND member.user_id = ${userId}::uuid
        AND EXISTS (SELECT 1 FROM messages WHERE id = ${messageId}::uuid)
        AND NOT EXISTS (
          SELECT 1 FROM messages AS current_message, messages AS candidate
          WHERE current_message.id = member.last_read_message_id
            AND candidate.id = ${messageId}::uuid
            AND (current_message.created_at, current_message.id)
              >= (candidate.created_at, candidate.id)
        )
    `;
    await this.realtime.emitConversationEvent(
      message.conversation_id,
      'message:receipt',
      {
        ...receipt,
        read_at: settings?.read_receipts === false ? null : receipt.read_at,
      },
    );
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
