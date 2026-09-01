import { Module } from '@nestjs/common';

import { PinnedMessagesController } from './pinned-messages.controller';
import { PinnedMessagesService } from './providers/pinned-messages.service';

@Module({
  controllers: [PinnedMessagesController],
  providers: [PinnedMessagesService],
})
export class PinnedMessagesModule {}
