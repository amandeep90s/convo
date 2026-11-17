import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { LoginChallenge } from '@repo/shared';

import type { AuthRequestContext } from '@/auth/providers/session.provider';
import { SessionProvider } from '@/auth/providers/session.provider';
import { MailService } from '@/mail/mail.service';
import { PrismaService } from '@/prisma.service';

const OTP_LIFETIME_MINUTES = 10;
const OTP_LIFETIME_MS = OTP_LIFETIME_MINUTES * 60_000;
const OTP_RESEND_COOLDOWN_MS = 60_000;
const OTP_MAX_ATTEMPTS = 5;

@Injectable()
export class LoginOtpProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly sessionProvider: SessionProvider,
    private readonly jwtService: JwtService,
  ) {}

  async request(email: string): Promise<LoginChallenge> {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        email_verified_at: { not: null },
        status: 'active',
        deleted_at: null,
      },
      select: { id: true, email: true, name: true },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const now = new Date();
    const existing = await this.prisma.loginOtp.findUnique({
      where: { user_id: user.id },
      select: {
        created_at: true,
        code_hash: true,
        expires_at: true,
        attempts: true,
      },
    });
    if (
      existing &&
      existing.expires_at > now &&
      existing.attempts < OTP_MAX_ATTEMPTS &&
      now.getTime() - existing.created_at.getTime() < OTP_RESEND_COOLDOWN_MS
    ) {
      return this.challenge(user.id, user.email, existing.code_hash);
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    await this.prisma.loginOtp.upsert({
      where: { user_id: user.id },
      create: {
        user_id: user.id,
        code_hash: this.hashCode(user.id, code),
        expires_at: new Date(now.getTime() + OTP_LIFETIME_MS),
      },
      update: {
        code_hash: this.hashCode(user.id, code),
        expires_at: new Date(now.getTime() + OTP_LIFETIME_MS),
        attempts: 0,
        created_at: now,
      },
    });

    await this.mailService.sendLoginOtpEmail(
      user.email,
      user.name,
      code,
      `${OTP_LIFETIME_MINUTES} minutes`,
    );
    return this.challenge(user.id, user.email, this.hashCode(user.id, code));
  }

  private async challenge(
    userId: string,
    email: string,
    codeHash: string,
  ): Promise<LoginChallenge> {
    return {
      email,
      challengeToken: await this.jwtService.signAsync(
        { sub: userId, type: 'login-challenge', otp: codeHash },
        { expiresIn: OTP_LIFETIME_MINUTES * 60 },
      ),
    };
  }

  async verify(
    challengeToken: string,
    code: string,
    context: AuthRequestContext,
  ) {
    let challenge: { sub: string; type: string; otp: string };
    try {
      challenge = await this.jwtService.verifyAsync(challengeToken, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        audience: this.configService.getOrThrow<string>('JWT_TOKEN_AUDIENCE'),
        issuer: this.configService.getOrThrow<string>('JWT_TOKEN_ISSUER'),
      });
    } catch {
      throw this.invalidCode();
    }
    if (
      challenge.type !== 'login-challenge' ||
      typeof challenge.sub !== 'string' ||
      typeof challenge.otp !== 'string'
    ) {
      throw this.invalidCode();
    }
    const user = await this.prisma.user.findFirst({
      where: {
        id: challenge.sub,
        email_verified_at: { not: null },
        status: 'active',
        deleted_at: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        status: true,
        avatar_url: true,
      },
    });
    if (!user) throw this.invalidCode();

    const now = new Date();
    const otp = await this.prisma.loginOtp.findUnique({
      where: { user_id: user.id },
    });
    if (
      !otp ||
      otp.code_hash !== challenge.otp ||
      otp.expires_at <= now ||
      otp.attempts >= OTP_MAX_ATTEMPTS ||
      !this.matchesCode(user.id, code, otp.code_hash)
    ) {
      if (
        otp &&
        otp.code_hash === challenge.otp &&
        otp.expires_at > now &&
        otp.attempts < OTP_MAX_ATTEMPTS
      ) {
        await this.prisma.loginOtp.updateMany({
          where: {
            user_id: user.id,
            code_hash: otp.code_hash,
            expires_at: { gt: now },
            attempts: { lt: OTP_MAX_ATTEMPTS },
          },
          data: { attempts: { increment: 1 } },
        });
      }
      throw this.invalidCode();
    }

    const consumed = await this.prisma.loginOtp.deleteMany({
      where: {
        user_id: user.id,
        code_hash: otp.code_hash,
        expires_at: { gt: now },
        attempts: { lt: OTP_MAX_ATTEMPTS },
      },
    });
    if (consumed.count !== 1) throw this.invalidCode();

    return this.sessionProvider.create(user, context);
  }

  private hashCode(userId: string, code: string): string {
    const secret = this.configService.getOrThrow<string>('JWT_SECRET');
    return createHmac('sha256', secret)
      .update(`${userId}:${code}`)
      .digest('hex');
  }

  private matchesCode(
    userId: string,
    code: string,
    storedHash: string,
  ): boolean {
    const candidate = Buffer.from(this.hashCode(userId, code), 'hex');
    const stored = Buffer.from(storedHash, 'hex');
    return (
      candidate.length === stored.length && timingSafeEqual(candidate, stored)
    );
  }

  private invalidCode(): UnauthorizedException {
    return new UnauthorizedException('Invalid or expired login code');
  }
}
