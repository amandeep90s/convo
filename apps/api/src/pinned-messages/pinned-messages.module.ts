import { Module } from '@nestjs/common';

import { PinnedMessagesController } from './pinned-messages.controller';
import { PinnedMessagesProvider } from './providers/pinned-messages.provider';
import { PinnedMessagesService } from './providers/pinned-messages.service';

@Module({
  controllers: [PinnedMessagesController],
  providers: [PinnedMessagesService, PinnedMessagesProvider],
})
export class PinnedMessagesModule {}
