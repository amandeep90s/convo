import { randomBytes } from 'node:crypto';

import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { db } from '@repo/db';
import type { RegisterDto, TRegisterResponse } from '@repo/shared';

import { HashingProvider } from '@/auth/providers/hashing.provider';
import { MailService } from '@/mail/mail.service';
import { UsersService } from '@/users/providers/users.service';

@Injectable()
export class RegisterUserProvider {
  constructor(
    /**
     * Injecting UsersService to access user data
     */
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,

    /**
     * Injecting Configuration service to access application configuration
     */
    private readonly configService: ConfigService,

    /**
     * Injecting Mail service to send verification emails
     */
    private readonly mailService: MailService,

    /**
     * Injecting HashingProvider to handle password and token hashing
     */
    private readonly hashingProvider: HashingProvider,
  ) {}

  public async register(body: RegisterDto) {
    const existingUsername = await this.usersService.findOneByUsername(
      body.username,
    );

    if (existingUsername) {
      throw new ConflictException('User with this username already exists');
    }

    const existingEmail = await this.usersService.findOneByEmail(body.email);

    if (existingEmail) {
      throw new ConflictException('User with this email already exists');
    }

    const user = await this.usersService.create(body);

    // Issue a verification token and send a verification email to the user
    await this.issueVerificationToken(user);

    return {
      message: 'User registered successfully',
    };
  }

  private async issueVerificationToken(user: TRegisterResponse): Promise<void> {
    const token = randomBytes(32).toString('hex');
    const tokenExpiresIn = this.configService.getOrThrow<number>(
      'mail.verificationTokenTtl',
    );
    const expiresAt = new Date(Date.now() + tokenExpiresIn * 60_000);

    await db.emailVerification.create({
      data: {
        user_id: user.id,
        token_hash: this.hashingProvider.hashToken(token),
        expires_at: expiresAt,
      },
    });

    await this.mailService.sendVerificationEmail(user.email, user.name, token);
  }
}
