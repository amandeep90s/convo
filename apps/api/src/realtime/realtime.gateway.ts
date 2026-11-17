import { OnModuleDestroy } from '@nestjs/common';
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

  handleConnection(client: AuthenticatedSocket) {
    if (client.data.userId) {
      void client.join(this.userRoom(client.data.userId));
    }
  }

  handleDisconnect(_client: AuthenticatedSocket) {}

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
