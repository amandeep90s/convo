import { Module } from '@nestjs/common';

import { AuthModule } from '@/auth/auth.module';

import { UserSessionsProvider } from './providers/user-sessions.provider';
import { UserSessionsService } from './providers/user-sessions.service';
import { UserSessionsController } from './user-sessions.controller';

@Module({
  controllers: [UserSessionsController],
  providers: [UserSessionsService, UserSessionsProvider],
  imports: [AuthModule],
  exports: [UserSessionsService],
})
export class UserSessionsModule {}
