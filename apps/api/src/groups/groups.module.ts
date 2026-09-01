import { Module } from '@nestjs/common';

import { GroupsController } from './groups.controller';
import { GroupsProvider } from './providers/groups.provider';
import { GroupsService } from './providers/groups.service';

@Module({
  controllers: [GroupsController],
  providers: [GroupsService, GroupsProvider],
})
export class GroupsModule {}
