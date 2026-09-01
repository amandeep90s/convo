import { Module } from '@nestjs/common';
import { PinnedMessagesController } from './pinned-messages.controller';

@Module({
  controllers: [PinnedMessagesController],
})
export class PinnedMessagesModule {}
