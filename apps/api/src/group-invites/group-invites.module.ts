import { Module } from '@nestjs/common';

import { GroupInvitesController } from './group-invites.controller';
import { GroupInvitesProvider } from './providers/group-invites.provider';
import { GroupInvitesService } from './providers/group-invites.service';

@Module({
  controllers: [GroupInvitesController],
  providers: [GroupInvitesService, GroupInvitesProvider],
})
export class GroupInvitesModule {}
