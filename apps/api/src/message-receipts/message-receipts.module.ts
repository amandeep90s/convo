import { Module } from '@nestjs/common';

import { MessageReceiptsController } from './message-receipts.controller';
import { MessageReceiptsService } from './providers/message-receipts.service';

@Module({
  controllers: [MessageReceiptsController],
  providers: [MessageReceiptsService],
})
export class MessageReceiptsModule {}
