import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ConversationAccessService } from '@/common/providers/conversation-access.service';
import { PrismaService } from '@/prisma.service';

@Injectable()
export class CallParticipantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ConversationAccessService,
  ) {}

  async list(userId: string, callId: string) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      select: {
        conversation_id: true,
        participants: { where: { user_id: userId }, select: { user_id: true } },
      },
    });
    if (!call) throw new NotFoundException('Call not found');
    await this.access.requireMember(call.conversation_id, userId);
    if (!call.participants.length)
      throw new NotFoundException('Call not found');
    return this.prisma.callParticipant.findMany({
      where: { call_id: callId },
      include: {
        user: {
          select: { id: true, username: true, name: true, avatar_url: true },
        },
      },
      orderBy: { joined_at: 'asc' },
    });
  }

  async join(userId: string, callId: string) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      select: { id: true, conversation_id: true, status: true },
    });
    if (!call || (call.status !== 'ringing' && call.status !== 'accepted')) {
      throw new BadRequestException('Call is no longer active');
    }
    await this.access.requireMember(call.conversation_id, userId);
    const participant = await this.prisma.callParticipant.upsert({
      where: { call_id_user_id: { call_id: callId, user_id: userId } },
      create: { call_id: callId, user_id: userId, joined_at: new Date() },
      update: { joined_at: new Date(), left_at: null },
    });
    if (call.status === 'ringing') {
      await this.prisma.call.update({
        where: { id: callId },
        data: { status: 'accepted', started_at: new Date() },
      });
    }
    return participant;
  }

  async leave(userId: string, callId: string) {
    const participant = await this.prisma.callParticipant.findUnique({
      where: { call_id_user_id: { call_id: callId, user_id: userId } },
      include: { call: { select: { conversation_id: true, status: true } } },
    });
    if (!participant || participant.left_at)
      throw new NotFoundException('Call participant not found');
    await this.access.requireMember(participant.call.conversation_id, userId);
    const now = new Date();
    await this.prisma.callParticipant.update({
      where: { call_id_user_id: { call_id: callId, user_id: userId } },
      data: { left_at: now },
    });
    if (participant.call.status === 'accepted') {
      const remaining = await this.prisma.callParticipant.count({
        where: { call_id: callId, left_at: null },
      });
      if (remaining === 0) {
        await this.prisma.call.update({
          where: { id: callId },
          data: { status: 'ended', ended_at: now },
        });
      }
    }
    return { left: true };
  }
}
