import { Module } from '@nestjs/common';
import { ConversationMembersController } from './conversation-members.controller';

@Module({
  controllers: [ConversationMembersController],
})
export class ConversationMembersModule {}
