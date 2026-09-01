import { Module } from '@nestjs/common';
import { MessageAttachmentsController } from './message-attachments.controller';

@Module({
  controllers: [MessageAttachmentsController],
})
export class MessageAttachmentsModule {}
