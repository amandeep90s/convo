import { randomUUID } from 'node:crypto';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { AuthSession, DeviceType } from '@repo/shared';

import { HashingProvider } from '@/auth/providers/hashing.provider';
import { PrismaService } from '@/prisma.service';

type SessionUser = {
  id: string;
  email: string;
  name: string;
  username: string;
  status: string;
  avatar_url: string | null;
};

export type AuthRequestContext = {
  ipAddress?: string;
  userAgent?: string;
  deviceName?: string;
  deviceType?: DeviceType;
};

type TokenPayload = {
  sub: string;
  sid: string;
  type: 'access' | 'refresh';
};

@Injectable()
export class SessionProvider {
  constructor(
    private readonly configService: ConfigService,
    private readonly hashingProvider: HashingProvider,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async create(
    user: SessionUser,
    context: AuthRequestContext,
  ): Promise<AuthSession> {
    const now = new Date();
    const sessionId = randomUUID();
    const deviceId = randomUUID();
    const refreshExpiresIn = durationInSeconds(
      this.configService.getOrThrow<string>('JWT_REFRESH_TOKEN_TTL'),
    );
    const refreshToken = await this.sign(
      user.id,
      sessionId,
      'refresh',
      refreshExpiresIn,
    );
    const expiresAt = new Date(now.getTime() + refreshExpiresIn * 1000);

    await this.prisma.$transaction(async (transaction) => {
      await transaction.userDevice.create({
        data: {
          id: deviceId,
          user_id: user.id,
          device_type: context.deviceType ?? 'web',
          device_name: context.deviceName ?? context.userAgent?.slice(0, 100),
          last_seen_at: now,
        },
      });
      await transaction.userSession.create({
        data: {
          id: sessionId,
          user_id: user.id,
          device_id: deviceId,
          refresh_token_hash: this.hashingProvider.hashToken(refreshToken),
          ip_address: context.ipAddress,
          user_agent: context.userAgent,
          expires_at: expiresAt,
        },
      });
    });

    return this.response(user, sessionId, refreshToken);
  }

  async refresh(refreshToken: string): Promise<AuthSession> {
    let payload: TokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<TokenPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        audience: this.configService.getOrThrow<string>('JWT_TOKEN_AUDIENCE'),
        issuer: this.configService.getOrThrow<string>('JWT_TOKEN_ISSUER'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (
      payload.type !== 'refresh' ||
      typeof payload.sub !== 'string' ||
      typeof payload.sid !== 'string'
    ) {
      throw new UnauthorizedException('Invalid refresh token');
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
      include: { user: true },
    });
    if (!session)
      throw new UnauthorizedException('Session is no longer active');

    const oldTokenHash = this.hashingProvider.hashToken(refreshToken);
    if (session.refresh_token_hash !== oldTokenHash) {
      await this.prisma.userSession.updateMany({
        where: { id: session.id, revoked_at: null },
        data: { revoked_at: new Date() },
      });
      throw new UnauthorizedException('Refresh token has already been used');
    }

    const refreshExpiresIn = durationInSeconds(
      this.configService.getOrThrow<string>('JWT_REFRESH_TOKEN_TTL'),
    );
    const nextRefreshToken = await this.sign(
      session.user_id,
      session.id,
      'refresh',
      refreshExpiresIn,
    );
    const nextTokenHash = this.hashingProvider.hashToken(nextRefreshToken);
    const rotation = await this.prisma.userSession.updateMany({
      where: {
        id: session.id,
        refresh_token_hash: oldTokenHash,
        revoked_at: null,
        expires_at: { gt: new Date() },
      },
      data: {
        refresh_token_hash: nextTokenHash,
        expires_at: new Date(Date.now() + refreshExpiresIn * 1000),
      },
    });
    if (rotation.count !== 1) {
      throw new UnauthorizedException('Refresh token has already been used');
    }

    return this.response(session.user, session.id, nextRefreshToken);
  }

  async revoke(sessionId: string, userId: string): Promise<{ revoked: true }> {
    await this.prisma.userSession.updateMany({
      where: { id: sessionId, user_id: userId, revoked_at: null },
      data: { revoked_at: new Date() },
    });
    return { revoked: true };
  }

  async list(userId: string) {
    return this.prisma.userSession.findMany({
      where: {
        user_id: userId,
        revoked_at: null,
        expires_at: { gt: new Date() },
      },
      select: {
        id: true,
        device_id: true,
        ip_address: true,
        user_agent: true,
        expires_at: true,
        created_at: true,
        device: {
          select: { device_type: true, device_name: true, last_seen_at: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    const result = await this.prisma.userSession.updateMany({
      where: { id: sessionId, user_id: userId, revoked_at: null },
      data: { revoked_at: new Date() },
    });
    if (result.count === 0)
      throw new UnauthorizedException('Session not found');
    return { revoked: true };
  }

  private async response(
    user: SessionUser,
    sessionId: string,
    refreshToken: string,
  ): Promise<AuthSession> {
    const accessExpiresIn = durationInSeconds(
      this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_TTL'),
    );
    const accessToken = await this.sign(
      user.id,
      sessionId,
      'access',
      accessExpiresIn,
    );
    return {
      accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + accessExpiresIn * 1000).toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'member',
        status: user.status === 'active' ? 'active' : 'inactive',
        avatarUrl: user.avatar_url,
      },
    };
  }

  private sign(
    userId: string,
    sessionId: string,
    type: TokenPayload['type'],
    expiresIn: number,
  ) {
    return this.jwtService.signAsync(
      { sub: userId, sid: sessionId, type } satisfies TokenPayload,
      { expiresIn },
    );
  }
}

function durationInSeconds(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) throw new Error(`Invalid token lifetime: ${value}`);
  const amount = Number(match[1]);
  const factor = { s: 1, m: 60, h: 3600, d: 86400 }[
    match[2] as 's' | 'm' | 'h' | 'd'
  ];
  return amount * factor;
}
