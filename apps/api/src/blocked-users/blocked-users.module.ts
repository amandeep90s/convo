import { Module } from '@nestjs/common';

import { BlockedUsersController } from './blocked-users.controller';
import { BlockedUsersProvider } from './providers/blocked-users.provider';
import { BlockedUsersService } from './providers/blocked-users.service';

@Module({
  controllers: [BlockedUsersController],
  providers: [BlockedUsersService, BlockedUsersProvider],
})
export class BlockedUsersModule {}
