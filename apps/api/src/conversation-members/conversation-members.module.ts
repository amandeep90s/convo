import { Module } from '@nestjs/common';

import { ConversationMembersController } from './conversation-members.controller';
import { ConversationMembersProvider } from './providers/conversation-members.provider';
import { ConversationMembersService } from './providers/conversation-members.service';

@Module({
  controllers: [ConversationMembersController],
  providers: [ConversationMembersService, ConversationMembersProvider],
})
export class ConversationMembersModule {}
