import { randomBytes } from 'node:crypto';

import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TRegisterResponse } from '@repo/shared';

import { HashingProvider } from '@/auth/providers/hashing.provider';
import { PrismaService } from '@/prisma.service';
import { FindOneUserByEmailProvider } from '@/users/providers/find-one-user-by-email.provider';

import { SendVerificationEmailProvider } from './send-verification-email.provider';

@Injectable()
export class VerificationTokenProvider {
  constructor(
    /**
     * Injecting Configuration service to access application configuration
     */
    private readonly configService: ConfigService,

    /**
     * Injecting HashingProvider to handle password and token hashing
     */
    private readonly hashingProvider: HashingProvider,

    /**
     * Injecting PrismaService to handle database operations
     */
    private readonly prisma: PrismaService,

    /**
     * Injecting SendVerificationEmailProvider to send verification emails to users
     */
    private readonly sendVerificationEmail: SendVerificationEmailProvider,

    /**
     * Injecting FindOneUserByEmailProvider to find users by email
     */
    private readonly findOneUserByEmailProvider: FindOneUserByEmailProvider,
  ) {}

  async issue(user: TRegisterResponse): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const tokenExpiresIn = this.configService.getOrThrow<number>(
      'mail.verificationTokenTtl',
    );
    const expiresAt = new Date(Date.now() + tokenExpiresIn * 60_000);

    await this.prisma.emailVerification.create({
      data: {
        user_id: user.id,
        token_hash: this.hashingProvider.hashToken(token),
        expires_at: expiresAt,
      },
    });

    return token;
  }

  async verify(token: string): Promise<boolean> {
    const tokenHash = this.hashingProvider.hashToken(token);

    const verificationToken = await this.prisma.emailVerification.findUnique({
      where: { token_hash: tokenHash },
    });

    if (!verificationToken || verificationToken.expires_at < new Date()) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.$transaction([
      this.prisma.emailVerification.deleteMany({
        where: { user_id: verificationToken.user_id },
      }),
      this.prisma.user.update({
        where: { id: verificationToken.user_id },
        data: { email_verified_at: new Date() },
      }),
    ]);

    return true;
  }

  async resend(email: string): Promise<boolean> {
    const user = await this.findOneUserByEmailProvider.findOneByEmail(email);

    if (!user || user.email_verified_at) return true;

    // Delete any existing verification tokens for the user before resending a new one
    await this.delete(user.id);

    // Resend the verification token by creating a new one and sending it to the user
    const token = await this.issue(user);

    // Send the verification email to the user with the new token
    await this.sendVerificationEmail.send(user.email, user.name, token);

    return true;
  }

  private async delete(userId: string): Promise<void> {
    await this.prisma.emailVerification.deleteMany({
      where: { user_id: userId },
    });
  }
}
