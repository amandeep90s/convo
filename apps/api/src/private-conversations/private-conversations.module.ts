import { Module } from '@nestjs/common';

import { PrivateConversationsController } from './private-conversations.controller';
import { PrivateConversationsService } from './providers/private-conversations.service';

@Module({
  controllers: [PrivateConversationsController],
  providers: [PrivateConversationsService],
})
export class PrivateConversationsModule {}
