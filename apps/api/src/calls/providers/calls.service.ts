import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CreateCallDto, UpdateCallDto } from '@repo/shared';

import { ConversationAccessService } from '@/common/providers/conversation-access.service';
import { PrismaService } from '@/prisma.service';
import { RealtimeGateway } from '@/realtime/realtime.gateway';

@Injectable()
export class CallsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ConversationAccessService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async list(
    userId: string,
    conversationId: string | undefined,
    page: number,
    limit: number,
  ) {
    if (conversationId) await this.access.requireMember(conversationId, userId);
    const where = {
      conversation_id: conversationId,
      participants: { some: { user_id: userId } },
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.call.findMany({
        where,
        include: {
          participants: {
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
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.call.count({ where }),
    ]);
    return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  async get(userId: string, callId: string) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      include: {
        participants: {
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
    });
    if (!call) throw new NotFoundException('Call not found');
    await this.access.requireMember(call.conversation_id, userId);
    if (
      !call.participants.some((participant) => participant.user_id === userId)
    ) {
      throw new NotFoundException('Call not found');
    }
    return call;
  }

  async create(userId: string, data: CreateCallDto) {
    await this.access.requireMember(data.conversation_id, userId);
    const members = await this.prisma.conversationMember.findMany({
      where: { conversation_id: data.conversation_id, left_at: null },
      select: { user_id: true },
    });
    const now = new Date();
    const call = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.call.create({
        data: {
          conversation_id: data.conversation_id,
          initiated_by: userId,
          type: data.type,
          status: 'ringing',
          participants: {
            create: members.map(({ user_id }) => ({
              user_id,
              joined_at: user_id === userId ? now : null,
            })),
          },
        },
        include: { participants: true },
      });
      return created;
    });
    for (const member of members) {
      if (member.user_id !== userId) {
        this.realtime.emitUserEvent(member.user_id, 'call:incoming', call);
      }
    }
    return call;
  }

  async update(userId: string, callId: string, data: UpdateCallDto) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      include: { participants: true },
    });
    if (!call) throw new NotFoundException('Call not found');
    await this.access.requireMember(call.conversation_id, userId);
    const participant = call.participants.find(
      (entry) => entry.user_id === userId,
    );
    if (!participant || participant.left_at)
      throw new NotFoundException('Call not found');
    if (!data.status) throw new BadRequestException('Call status is required');

    const now = new Date();
    if (data.status === 'accepted') {
      if (call.status !== 'ringing')
        throw new BadRequestException('Only ringing calls can be accepted');
      await this.prisma.callParticipant.update({
        where: { call_id_user_id: { call_id: callId, user_id: userId } },
        data: { joined_at: now, left_at: null },
      });
      const updated = await this.prisma.call.update({
        where: { id: callId },
        data: { status: 'accepted', started_at: call.started_at ?? now },
      });
      this.realtime.emitConversationEvent(
        call.conversation_id,
        'call:updated',
        updated,
      );
      return updated;
    }

    if (data.status === 'rejected' || data.status === 'missed') {
      if (call.status !== 'ringing')
        throw new BadRequestException('Only ringing calls can be rejected');
      if (data.status === 'rejected' && call.initiated_by === userId) {
        throw new ForbiddenException('Call initiators must end their own call');
      }
      if (data.status === 'missed' && call.initiated_by !== userId) {
        throw new ForbiddenException(
          'Only the call initiator can mark a call as missed',
        );
      }
      await this.prisma.callParticipant.update({
        where: { call_id_user_id: { call_id: callId, user_id: userId } },
        data: { left_at: now },
      });
      const remaining = await this.prisma.callParticipant.count({
        where: { call_id: callId, left_at: null },
      });
      const updated = await this.prisma.call.update({
        where: { id: callId },
        data:
          remaining === 0
            ? { status: data.status, ended_at: now }
            : { status: 'ringing' },
      });
      this.realtime.emitConversationEvent(
        call.conversation_id,
        'call:updated',
        updated,
      );
      return updated;
    }

    if (data.status === 'ended') {
      await this.prisma.callParticipant.update({
        where: { call_id_user_id: { call_id: callId, user_id: userId } },
        data: { left_at: now },
      });
      const updated = await this.prisma.call.update({
        where: { id: callId },
        data: { status: 'ended', ended_at: now },
      });
      await this.prisma.callParticipant.updateMany({
        where: { call_id: callId, left_at: null },
        data: { left_at: now },
      });
      this.realtime.emitConversationEvent(
        call.conversation_id,
        'call:updated',
        updated,
      );
      return updated;
    }

    throw new BadRequestException(
      `Unsupported call transition to ${data.status}`,
    );
  }
}
