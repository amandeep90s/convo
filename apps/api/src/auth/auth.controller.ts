import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { LoginDto } from '@/auth/dtos/login.dto';
import { RegisterUserDto } from '@/auth/dtos/register.dto';
import { ResendVerificationDto } from '@/auth/dtos/resend-verification.dto';
import { VerifyEmailDto } from '@/auth/dtos/verify-email.dto';
import { AuthService } from '@/auth/providers/auth.service';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    /**
     * Injecting AuthService
     */
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('User registered successfully')
  register(@Body() body: RegisterUserDto) {
    return this.authService.register(body);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Email verified successfully')
  verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmail(body);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('If the account exists, a verification email has been sent')
  resendVerification(@Body() body: ResendVerificationDto) {
    return this.authService.resendVerification(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('User logged in successfully')
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }
}
