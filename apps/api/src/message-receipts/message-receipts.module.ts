import { Module } from '@nestjs/common';
import { MessageReceiptsController } from './message-receipts.controller';

@Module({
  controllers: [MessageReceiptsController],
})
export class MessageReceiptsModule {}
