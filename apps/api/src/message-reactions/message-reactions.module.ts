import { Module } from '@nestjs/common';

import { MessageReactionsController } from './message-reactions.controller';
import { MessageReactionsProvider } from './providers/message-reactions.provider';
import { MessageReactionsService } from './providers/message-reactions.service';

@Module({
  controllers: [MessageReactionsController],
  providers: [MessageReactionsService, MessageReactionsProvider],
})
export class MessageReactionsModule {}
