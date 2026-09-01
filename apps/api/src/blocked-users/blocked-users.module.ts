import { Module } from '@nestjs/common';

import { BlockedUsersController } from './blocked-users.controller';
import { BlockedUsersService } from './providers/blocked-users.service';

@Module({
  controllers: [BlockedUsersController],
  providers: [BlockedUsersService],
})
export class BlockedUsersModule {}
