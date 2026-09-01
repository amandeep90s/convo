import { Module } from '@nestjs/common';

import { ConversationMembersController } from './conversation-members.controller';
import { ConversationMembersService } from './providers/conversation-members.service';

@Module({
  controllers: [ConversationMembersController],
  providers: [ConversationMembersService],
})
export class ConversationMembersModule {}
