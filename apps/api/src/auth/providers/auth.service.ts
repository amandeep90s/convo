import { Injectable } from '@nestjs/common';
import type {
  RegisterDto,
  ResendVerificationDto,
  VerifyEmailDto,
} from '@repo/shared';

import { RegisterUserProvider } from '@/auth/providers/register-user.provider';

import { VerificationTokenProvider } from './verification-token.provider';

@Injectable()
export class AuthService {
  constructor(
    /**
     * Injecting RegisterUserProvider
     */
    private readonly registerUserProvider: RegisterUserProvider,

    /**
     * Injecting IssueVerificationTokenProvider to issue verification tokens and send verification emails
     */
    private readonly verificationToken: VerificationTokenProvider,
  ) {}

  async register(body: RegisterDto) {
    return await this.registerUserProvider.register(body);
  }

  async verifyEmail(body: VerifyEmailDto) {
    return await this.verificationToken.verify(body.token);
  }

  async resendVerification(body: ResendVerificationDto) {
    return await this.verificationToken.resend(body.email);
  }
}
