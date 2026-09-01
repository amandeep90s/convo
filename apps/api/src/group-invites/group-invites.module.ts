import { Module } from '@nestjs/common';
import { GroupInvitesController } from './group-invites.controller';

@Module({
  controllers: [GroupInvitesController],
})
export class GroupInvitesModule {}
