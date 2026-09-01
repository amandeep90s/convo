import { Module } from '@nestjs/common';

import { PrivateConversationsController } from './private-conversations.controller';
import { PrivateConversationsProvider } from './providers/private-conversations.provider';
import { PrivateConversationsService } from './providers/private-conversations.service';

@Module({
  controllers: [PrivateConversationsController],
  providers: [PrivateConversationsService, PrivateConversationsProvider],
})
export class PrivateConversationsModule {}
