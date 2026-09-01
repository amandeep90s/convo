import { Module } from '@nestjs/common';

import { MessageReceiptsController } from './message-receipts.controller';
import { MessageReceiptsProvider } from './providers/message-receipts.provider';
import { MessageReceiptsService } from './providers/message-receipts.service';

@Module({
  controllers: [MessageReceiptsController],
  providers: [MessageReceiptsService, MessageReceiptsProvider],
})
export class MessageReceiptsModule {}
