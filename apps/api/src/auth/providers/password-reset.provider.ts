import { randomBytes } from 'node:crypto';

import { BadRequestException, Injectable } from '@nestjs/common';

import { HashingProvider } from '@/auth/providers/hashing.provider';
import { MailService } from '@/mail/mail.service';
import { PrismaService } from '@/prisma.service';

@Injectable()
export class PasswordResetProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hashingProvider: HashingProvider,
    private readonly mailService: MailService,
  ) {}

  async request(email: string): Promise<{ accepted: true }> {
    const user = await this.prisma.user.findFirst({
      where: { email, deleted_at: null },
      select: { id: true, email: true, name: true, status: true },
    });
    if (!user || user.status !== 'active') return { accepted: true };

    const token = randomBytes(32).toString('hex');
    await this.prisma.$transaction([
      this.prisma.passwordReset.deleteMany({ where: { user_id: user.id } }),
      this.prisma.passwordReset.create({
        data: {
          user_id: user.id,
          token_hash: this.hashingProvider.hashToken(token),
          expires_at: new Date(Date.now() + 15 * 60_000),
        },
      }),
    ]);
    await this.mailService.sendPasswordResetEmail(user.email, user.name, token);
    return { accepted: true };
  }

  async reset(token: string, password: string): Promise<{ reset: true }> {
    const tokenHash = this.hashingProvider.hashToken(token);
    const passwordReset = await this.prisma.passwordReset.findUnique({
      where: { token_hash: tokenHash },
    });
    if (!passwordReset || passwordReset.expires_at <= new Date()) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const passwordHash = await this.hashingProvider.hashPassword(password);
    await this.prisma.$transaction(async (transaction) => {
      const consumed = await transaction.passwordReset.deleteMany({
        where: {
          id: passwordReset.id,
          token_hash: tokenHash,
          expires_at: { gt: new Date() },
        },
      });
      if (consumed.count !== 1) {
        throw new BadRequestException(
          'Invalid or expired password reset token',
        );
      }
      await transaction.user.update({
        where: { id: passwordReset.user_id },
        data: { password_hash: passwordHash },
      });
      await transaction.passwordReset.deleteMany({
        where: { user_id: passwordReset.user_id },
      });
      await transaction.loginOtp.deleteMany({
        where: { user_id: passwordReset.user_id },
      });
      await transaction.userSession.updateMany({
        where: { user_id: passwordReset.user_id, revoked_at: null },
        data: { revoked_at: new Date() },
      });
    });
    return { reset: true };
  }
}
