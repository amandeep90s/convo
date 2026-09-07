import { forwardRef, Module } from '@nestjs/common';

import { AuthController } from '@/auth/auth.controller';
import { Argon2Provider } from '@/auth/providers/argon2.provider';
import { AuthProvider } from '@/auth/providers/auth.provider';
import { AuthService } from '@/auth/providers/auth.service';
import { HashingProvider } from '@/auth/providers/hashing.provider';
import { LoginUserProvider } from '@/auth/providers/login-user.provider';
import { RegisterUserProvider } from '@/auth/providers/register-user.provider';
import { SendVerificationEmailProvider } from '@/auth/providers/send-verification-email.provider';
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
  ],
  exports: [AuthService, HashingProvider],
  imports: [forwardRef(() => UsersModule)],
})
export class AuthModule {}
