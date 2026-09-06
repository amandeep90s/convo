import { forwardRef, Module } from '@nestjs/common';

import { AuthController } from '@/auth/auth.controller';
import { Argon2Provider } from '@/auth/providers/argon2.provider';
import { AuthProvider } from '@/auth/providers/auth.provider';
import { AuthService } from '@/auth/providers/auth.service';
import { HashingProvider } from '@/auth/providers/hashing.provider';
import { RegisterUserProvider } from '@/auth/providers/register-user.provider';
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
  ],
  exports: [AuthService, HashingProvider],
  imports: [forwardRef(() => UsersModule)],
})
export class AuthModule {}
