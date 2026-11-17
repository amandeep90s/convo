import { Module } from '@nestjs/common';

import { MessagesController } from './messages.controller';
import { MessagesProvider } from './providers/messages.provider';
import { MessagesService } from './providers/messages.service';

@Module({
  controllers: [MessagesController],
  providers: [MessagesService, MessagesProvider],
  exports: [MessagesService],
})
export class MessagesModule {}
