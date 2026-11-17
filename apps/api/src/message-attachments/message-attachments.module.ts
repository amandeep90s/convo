import { Module } from '@nestjs/common';

import { MessagesModule } from '@/messages/messages.module';

import { MessageAttachmentsController } from './message-attachments.controller';
import { MessageAttachmentsProvider } from './providers/message-attachments.provider';
import { MessageAttachmentsService } from './providers/message-attachments.service';

@Module({
  imports: [MessagesModule],
  controllers: [MessageAttachmentsController],
  providers: [MessageAttachmentsService, MessageAttachmentsProvider],
})
export class MessageAttachmentsModule {}
