import { Module } from '@nestjs/common';

import { CommunitiesController } from './communities.controller';
import { GroupsController } from './groups.controller';
import { GroupsProvider } from './providers/groups.provider';
import { GroupsService } from './providers/groups.service';

@Module({
  controllers: [GroupsController, CommunitiesController],
  providers: [GroupsService, GroupsProvider],
})
export class GroupsModule {}
