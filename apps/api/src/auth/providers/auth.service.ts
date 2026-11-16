import { Injectable } from '@nestjs/common';
import type {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  RequestLoginOtpDto,
  ResendVerificationDto,
  ResetPasswordDto,
  VerifyEmailDto,
  VerifyLoginOtpDto,
} from '@repo/shared';

import { LoginOtpProvider } from '@/auth/providers/login-otp.provider';
import { LoginUserProvider } from '@/auth/providers/login-user.provider';
import { PasswordResetProvider } from '@/auth/providers/password-reset.provider';
import { RegisterUserProvider } from '@/auth/providers/register-user.provider';
import type { AuthRequestContext } from '@/auth/providers/session.provider';
import { SessionProvider } from '@/auth/providers/session.provider';
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

    private readonly sessionProvider: SessionProvider,

    private readonly passwordResetProvider: PasswordResetProvider,

    private readonly loginOtpProvider: LoginOtpProvider,
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

  async login(body: LoginDto, context: AuthRequestContext) {
    return this.loginUserProvider.login(body, context);
  }

  async requestLoginOtp(body: RequestLoginOtpDto) {
    return this.loginOtpProvider.request(body.email);
  }

  async verifyLoginOtp(body: VerifyLoginOtpDto, context: AuthRequestContext) {
    return this.loginOtpProvider.verify(body.email, body.code, context);
  }

  async refresh(refreshToken: string) {
    return this.sessionProvider.refresh(refreshToken);
  }

  async logout(userId: string, sessionId: string) {
    return this.sessionProvider.revoke(sessionId, userId);
  }

  async forgotPassword(body: ForgotPasswordDto) {
    return this.passwordResetProvider.request(body.email);
  }

  async resetPassword(body: ResetPasswordDto) {
    return this.passwordResetProvider.reset(body.token, body.password);
  }
}
