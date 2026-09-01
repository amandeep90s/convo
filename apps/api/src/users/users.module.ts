import { Module } from '@nestjs/common';

import { UsersProvider } from './providers/users.provider';
import { UsersService } from './providers/users.service';
import { UsersController } from './users.controller';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersProvider],
})
export class UsersModule {}
