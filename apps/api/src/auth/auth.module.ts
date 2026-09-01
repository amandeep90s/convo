import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthProvider } from './providers/auth.provider';
import { AuthService } from './providers/auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthProvider],
})
export class AuthModule {}
