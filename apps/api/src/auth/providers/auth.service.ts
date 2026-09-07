import { Injectable } from '@nestjs/common';
import type {
  LoginDto,
  RegisterDto,
  ResendVerificationDto,
  VerifyEmailDto,
} from '@repo/shared';

import { LoginUserProvider } from '@/auth/providers/login-user.provider';
import { RegisterUserProvider } from '@/auth/providers/register-user.provider';
import { VerificationTokenProvider } from '@/auth/providers/verification-token.provider';

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
    private readonly verificationTokenProvider: VerificationTokenProvider,

    /**
     * Injecting LoginUserProvider
     */
    private readonly loginUserProvider: LoginUserProvider,
  ) {}

  async register(body: RegisterDto) {
    return await this.registerUserProvider.register(body);
  }

  async verifyEmail(body: VerifyEmailDto) {
    return await this.verificationTokenProvider.verify(body.token);
  }

  async resendVerification(body: ResendVerificationDto) {
    return await this.verificationTokenProvider.resend(body.email);
  }

  async login(body: LoginDto) {
    return await this.loginUserProvider.login(body);
  }
}
