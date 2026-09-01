import { Module } from '@nestjs/common';
import { BlockedUsersController } from './blocked-users.controller';

@Module({
  controllers: [BlockedUsersController],
})
export class BlockedUsersModule {}
