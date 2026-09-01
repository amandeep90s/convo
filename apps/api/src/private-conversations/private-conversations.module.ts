import { Module } from '@nestjs/common';
import { PrivateConversationsController } from './private-conversations.controller';

@Module({
  controllers: [PrivateConversationsController],
})
export class PrivateConversationsModule {}
