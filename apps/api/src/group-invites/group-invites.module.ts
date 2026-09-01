import { Module } from '@nestjs/common';

import { GroupInvitesController } from './group-invites.controller';
import { GroupInvitesService } from './providers/group-invites.service';

@Module({
  controllers: [GroupInvitesController],
  providers: [GroupInvitesService],
})
export class GroupInvitesModule {}
