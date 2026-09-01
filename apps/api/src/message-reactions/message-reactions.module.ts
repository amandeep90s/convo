import { Module } from '@nestjs/common';
import { MessageReactionsController } from './message-reactions.controller';

@Module({
  controllers: [MessageReactionsController],
})
export class MessageReactionsModule {}
