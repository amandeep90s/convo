import { Module } from '@nestjs/common';

import { MessageReactionsController } from './message-reactions.controller';
import { MessageReactionsService } from './providers/message-reactions.service';

@Module({
  controllers: [MessageReactionsController],
  providers: [MessageReactionsService],
})
export class MessageReactionsModule {}
