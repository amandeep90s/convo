import { Module } from '@nestjs/common';

import { MessageAttachmentsController } from './message-attachments.controller';
import { MessageAttachmentsService } from './providers/message-attachments.service';

@Module({
  controllers: [MessageAttachmentsController],
  providers: [MessageAttachmentsService],
})
export class MessageAttachmentsModule {}
