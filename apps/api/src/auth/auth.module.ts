import { forwardRef, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from '@/auth/auth.controller';
import { Argon2Provider } from '@/auth/providers/argon2.provider';
import { AuthProvider } from '@/auth/providers/auth.provider';
import { AuthService } from '@/auth/providers/auth.service';
import { HashingProvider } from '@/auth/providers/hashing.provider';
import { LoginOtpProvider } from '@/auth/providers/login-otp.provider';
import { LoginUserProvider } from '@/auth/providers/login-user.provider';
import { PasswordResetProvider } from '@/auth/providers/password-reset.provider';
import { RegisterUserProvider } from '@/auth/providers/register-user.provider';
import { SendVerificationEmailProvider } from '@/auth/providers/send-verification-email.provider';
import { SessionProvider } from '@/auth/providers/session.provider';
import { VerificationTokenProvider } from '@/auth/providers/verification-token.provider';
import { UsersModule } from '@/users/users.module';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthProvider,
    RegisterUserProvider,
    {
      provide: HashingProvider,
      useClass: Argon2Provider,
    },
    VerificationTokenProvider,
    SendVerificationEmailProvider,
    LoginUserProvider,
    LoginOtpProvider,
    SessionProvider,
    PasswordResetProvider,
  ],
  exports: [AuthService, HashingProvider, JwtModule, SessionProvider],
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          audience: configService.getOrThrow<string>('JWT_TOKEN_AUDIENCE'),
          issuer: configService.getOrThrow<string>('JWT_TOKEN_ISSUER'),
        },
      }),
    }),
    forwardRef(() => UsersModule),
  ],
})
export class AuthModule {}
