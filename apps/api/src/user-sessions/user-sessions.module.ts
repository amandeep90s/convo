import { Module } from '@nestjs/common';

import { UserSessionsProvider } from './providers/user-sessions.provider';
import { UserSessionsService } from './providers/user-sessions.service';
import { UserSessionsController } from './user-sessions.controller';

@Module({
  controllers: [UserSessionsController],
  providers: [UserSessionsService, UserSessionsProvider],
})
export class UserSessionsModule {}
