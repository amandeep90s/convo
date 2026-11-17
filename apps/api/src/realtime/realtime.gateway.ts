import { Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { UserPresence } from '@repo/shared';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import type { Server, Socket } from 'socket.io';

import { ConversationAccessService } from '@/common/providers/conversation-access.service';
import { PrismaService } from '@/prisma.service';

type AuthenticatedSocket = Socket & {
  data: { userId?: string; sessionId?: string };
};

type CallSignal = {
  callId: string;
  targetUserId: string;
  type: 'offer' | 'answer' | 'ice-candidate';
  payload: unknown;
};

@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = (
        process.env.CORS_ORIGINS ||
        process.env.WEB_URL ||
        'http://localhost:3000'
      )
        .split(',')
        .map((value) => value.trim());
      callback(null, !origin || allowedOrigins.includes(origin));
    },
    credentials: true,
  },
})
export class RealtimeGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleDestroy
{
  @WebSocketServer()
  private server!: Server;

  private publisher?: Redis;
  private subscriber?: Redis;
  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly access: ConversationAccessService,
  ) {}

  async afterInit(server: Server) {
    server.use((socket, next) => {
      void this.authenticate(socket as AuthenticatedSocket)
        .then(() => next())
        .catch(() => next(new Error('Unauthorized')));
    });

    this.publisher = new Redis({
      host: this.configService.getOrThrow<string>('app.redisHost'),
      port: this.configService.getOrThrow<number>('app.redisPort'),
      lazyConnect: true,
    });
    this.subscriber = this.publisher.duplicate();
    await Promise.all([this.publisher.connect(), this.subscriber.connect()]);
    server.adapter(createAdapter(this.publisher, this.subscriber));
  }

  async handleConnection(client: AuthenticatedSocket) {
    if (client.data.userId) {
      await client.join(this.userRoom(client.data.userId));
      await this.publishPresence(client.data.userId);
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.data.userId) await this.publishPresence(client.data.userId);
  }

  async presenceFor(
    viewerId: string,
    userIds: string[],
  ): Promise<Map<string, UserPresence>> {
    const ids = [...new Set(userIds)];
    const result = new Map<string, UserPresence>(ids.map((id) => [id, null]));
    if (!ids.length) return result;
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids }, status: 'active', deleted_at: null },
      select: {
        id: true,
        settings: { select: { online_visibility: true } },
        contacts: {
          where: { contact_user_id: viewerId },
          select: { contact_user_id: true },
        },
        blocked_users: {
          where: { blocked_user_id: viewerId },
          select: { user_id: true },
        },
        blocked_by: { where: { user_id: viewerId }, select: { user_id: true } },
      },
    });
    const visible = users.filter((user) => {
      if (user.blocked_users.length || user.blocked_by.length) return false;
      const visibility = user.settings?.online_visibility ?? 'contacts';
      return (
        user.id === viewerId ||
        visibility === 'everyone' ||
        (visibility === 'contacts' && user.contacts.length > 0)
      );
    });
    if (!visible.length) return result;
    const sockets = await this.server
      .in(visible.map(({ id }) => this.userRoom(id)))
      .fetchSockets();
    const sessionIds = sockets
      .map((socket) => socket.data.sessionId)
      .filter((id): id is string => typeof id === 'string');
    const sessions = sessionIds.length
      ? await this.prisma.userSession.findMany({
          where: {
            id: { in: sessionIds },
            revoked_at: null,
            expires_at: { gt: new Date() },
            device: { revoked_at: null },
            user: { status: 'active', deleted_at: null },
          },
          select: { user_id: true },
        })
      : [];
    const online = new Set(sessions.map(({ user_id }) => user_id));
    for (const user of visible)
      result.set(user.id, online.has(user.id) ? 'online' : 'offline');
    return result;
  }

  private async publishPresence(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          settings: { select: { online_visibility: true } },
          contacts: { select: { contact_user_id: true } },
          blocked_users: { select: { blocked_user_id: true } },
          blocked_by: { select: { user_id: true } },
        },
      });
      if (!user) return;
      const visibility = user.settings?.online_visibility ?? 'contacts';
      if (visibility === 'nobody') return;
      const contacts = new Set(
        user.contacts.map(({ contact_user_id }) => contact_user_id),
      );
      const blocked = new Set([
        ...user.blocked_users.map(({ blocked_user_id }) => blocked_user_id),
        ...user.blocked_by.map(({ user_id }) => user_id),
      ]);
      const members = await this.prisma.conversationMember.findMany({
        where: {
          user_id: { not: userId },
          left_at: null,
          conversation: {
            deleted_at: null,
            type: 'private',
            members: { some: { user_id: userId, left_at: null } },
          },
        },
        select: { user_id: true },
        distinct: ['user_id'],
      });
      const rooms = members
        .filter(
          ({ user_id }) =>
            !blocked.has(user_id) &&
            (visibility === 'everyone' || contacts.has(user_id)),
        )
        .map(({ user_id }) => this.userRoom(user_id));
      if (rooms.length) this.server.to(rooms).emit('presence:updated');
    } catch (reason) {
      this.logger.error(
        'Could not publish presence update',
        reason instanceof Error ? reason.stack : String(reason),
      );
    }
  }

  async onModuleDestroy() {
    await Promise.all([this.publisher?.quit(), this.subscriber?.quit()]);
  }

  @SubscribeMessage('conversation:join')
  async joinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { conversationId?: string },
  ) {
    const conversationId = body?.conversationId;
    if (!client.data.userId || !conversationId) return { ok: false };
    await this.access.requireMember(conversationId, client.data.userId);
    await client.join(this.conversationRoom(conversationId));
    return { ok: true };
  }

  @SubscribeMessage('conversation:leave')
  async leaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { conversationId?: string },
  ) {
    if (body?.conversationId)
      await client.leave(this.conversationRoom(body.conversationId));
    return { ok: true };
  }

  @SubscribeMessage('call:signal')
  async relayCallSignal(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: CallSignal,
  ) {
    if (!client.data.userId || !isCallSignal(body)) return { ok: false };
    const participation = await this.prisma.callParticipant.findUnique({
      where: {
        call_id_user_id: { call_id: body.callId, user_id: client.data.userId },
      },
      include: { call: { select: { status: true, conversation_id: true } } },
    });
    if (
      !participation ||
      participation.left_at ||
      participation.call.status === 'ended'
    ) {
      return { ok: false };
    }
    await this.access.requireMember(
      participation.call.conversation_id,
      body.targetUserId,
    );
    const target = await this.prisma.callParticipant.findUnique({
      where: {
        call_id_user_id: { call_id: body.callId, user_id: body.targetUserId },
      },
      select: { left_at: true },
    });
    if (!target || target.left_at) return { ok: false };
    this.server.to(this.userRoom(body.targetUserId)).emit('call:signal', {
      callId: body.callId,
      fromUserId: client.data.userId,
      type: body.type,
      payload: body.payload,
    });
    return { ok: true };
  }

  async emitConversationEvent(
    conversationId: string,
    event: string,
    payload: object,
  ) {
    const members = await this.prisma.conversationMember.findMany({
      where: { conversation_id: conversationId, left_at: null },
      select: { user_id: true },
    });
    if (members.length) {
      this.server
        .to(members.map(({ user_id }) => this.userRoom(user_id)))
        .emit(event, { ...payload, conversation_id: conversationId });
    }
  }

  emitUserEvent(userId: string, event: string, payload: unknown) {
    this.server?.to(this.userRoom(userId)).emit(event, payload);
  }

  private async authenticate(socket: AuthenticatedSocket): Promise<void> {
    const authToken = socket.handshake.auth['token'];
    const header = socket.handshake.headers.authorization;
    const token =
      typeof authToken === 'string'
        ? authToken
        : typeof header === 'string'
          ? header.match(/^Bearer\s+(.+)$/i)?.[1]
          : undefined;
    if (!token) throw new Error('Missing access token');

    const payload = await this.jwtService.verifyAsync<{
      sub: string;
      sid: string;
      type: string;
    }>(token, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      audience: this.configService.getOrThrow<string>('JWT_TOKEN_AUDIENCE'),
      issuer: this.configService.getOrThrow<string>('JWT_TOKEN_ISSUER'),
    });
    if (
      !['access', 'socket'].includes(payload.type) ||
      typeof payload.sub !== 'string' ||
      typeof payload.sid !== 'string' ||
      !payload.sub ||
      !payload.sid
    ) {
      throw new Error('Invalid access token');
    }
    const session = await this.prisma.userSession.findFirst({
      where: {
        id: payload.sid,
        user_id: payload.sub,
        revoked_at: null,
        expires_at: { gt: new Date() },
        device: { revoked_at: null },
        user: { status: 'active', deleted_at: null },
      },
      select: { id: true, user_id: true },
    });
    if (!session) throw new Error('Session is no longer active');
    socket.data.userId = session.user_id;
    socket.data.sessionId = session.id;
  }

  private conversationRoom(id: string) {
    return `conversation:${id}`;
  }

  private userRoom(id: string) {
    return `user:${id}`;
  }
}

function isCallSignal(value: unknown): value is CallSignal {
  if (!value || typeof value !== 'object') return false;
  const signal = value as Partial<CallSignal>;
  return (
    typeof signal.callId === 'string' &&
    typeof signal.targetUserId === 'string' &&
    ['offer', 'answer', 'ice-candidate'].includes(signal.type ?? '') &&
    signal.payload !== undefined
  );
}
