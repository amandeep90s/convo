import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';

import { ForgotPasswordDto } from '@/auth/dtos/forgot-password.dto';
import { LoginDto } from '@/auth/dtos/login.dto';
import { RefreshSessionDto } from '@/auth/dtos/refresh-session.dto';
import { RegisterUserDto } from '@/auth/dtos/register.dto';
import { RequestLoginOtpDto } from '@/auth/dtos/request-login-otp.dto';
import { ResendVerificationDto } from '@/auth/dtos/resend-verification.dto';
import { ResetPasswordDto } from '@/auth/dtos/reset-password.dto';
import { VerifyEmailDto } from '@/auth/dtos/verify-email.dto';
import { VerifyLoginOtpDto } from '@/auth/dtos/verify-login-otp.dto';
import { AuthService } from '@/auth/providers/auth.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import type { AuthenticatedUser } from '@/common/types/authenticated-user';

@Controller('auth')
export class AuthController {
  constructor(
    /**
     * Injecting AuthService
     */
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('User registered successfully')
  register(@Body() body: RegisterUserDto) {
    return this.authService.register(body);
  }

  @Post('verify-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Email verified successfully')
  verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmail(body);
  }

  @Post('resend-verification')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('If the account exists, a verification email has been sent')
  resendVerification(@Body() body: ResendVerificationDto) {
    return this.authService.resendVerification(body);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('User logged in successfully')
  login(@Body() body: LoginDto, @Req() request: Request) {
    return this.authService.login(body, {
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
    });
  }

  @Post('login/otp/request')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('If the account exists, a login code has been sent')
  requestLoginOtp(@Body() body: RequestLoginOtpDto) {
    return this.authService.requestLoginOtp(body);
  }

  @Post('login/otp/verify')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('User logged in successfully')
  verifyLoginOtp(@Body() body: VerifyLoginOtpDto, @Req() request: Request) {
    return this.authService.verifyLoginOtp(body, {
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
    });
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Session refreshed successfully')
  refresh(@Body() body: RefreshSessionDto) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Logged out successfully')
  logout(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.logout(user.id, user.sessionId);
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(
    'If the account exists, password reset instructions have been sent',
  )
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body);
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Password reset successfully')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }
}
