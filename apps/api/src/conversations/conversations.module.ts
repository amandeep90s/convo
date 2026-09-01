import { Module } from '@nestjs/common';

import { ConversationsController } from './conversations.controller';
import { ConversationsProvider } from './providers/conversations.provider';
import { ConversationsService } from './providers/conversations.service';

@Module({
  controllers: [ConversationsController],
  providers: [ConversationsService, ConversationsProvider],
})
export class ConversationsModule {}
