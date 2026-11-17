import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';
import type { AuthenticatedUser } from '@/common/types/authenticated-user';
import { PrismaService } from '@/prisma.service';

type AccessTokenPayload = {
  sub: string;
  sid: string;
  type: 'access' | 'refresh';
};

type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Socket authentication is performed by the gateway handshake, not HTTP headers.
    if (context.getType() === 'ws') {
      const client = context.switchToWs().getClient<{
        data: { userId?: string; sessionId?: string };
      }>();
      const { userId, sessionId } = client.data;
      if (!userId || !sessionId) return false;
      const session = await this.prisma.userSession.findFirst({
        where: {
          id: sessionId,
          user_id: userId,
          revoked_at: null,
          expires_at: { gt: new Date() },
          device: { revoked_at: null },
          user: { status: 'active', deleted_at: null },
        },
        select: { id: true },
      });
      return Boolean(session);
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

    if (!token) throw new UnauthorizedException('Bearer token is required');

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        audience: this.configService.getOrThrow<string>('JWT_TOKEN_AUDIENCE'),
        issuer: this.configService.getOrThrow<string>('JWT_TOKEN_ISSUER'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    if (
      payload.type !== 'access' ||
      typeof payload.sub !== 'string' ||
      typeof payload.sid !== 'string'
    ) {
      throw new UnauthorizedException('Invalid access token');
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

    if (!session)
      throw new UnauthorizedException('Session is no longer active');

    request.user = { id: session.user_id, sessionId: session.id };
    return true;
  }
}
