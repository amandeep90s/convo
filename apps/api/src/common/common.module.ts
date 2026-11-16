import { Global, Module } from '@nestjs/common';

import { ConversationAccessService } from '@/common/providers/conversation-access.service';

@Global()
@Module({
  providers: [ConversationAccessService],
  exports: [ConversationAccessService],
})
export class CommonModule {}
