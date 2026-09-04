import { forwardRef, Module } from '@nestjs/common';

import { UsersModule } from '@/users/users.module';

import { AuthController } from './auth.controller';
import { Argon2Provider } from './providers/argon2.provider';
import { AuthProvider } from './providers/auth.provider';
import { AuthService } from './providers/auth.service';
import { HashingProvider } from './providers/hashing.provider';
import { RegisterUserProvider } from './providers/register-user.provider';

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
