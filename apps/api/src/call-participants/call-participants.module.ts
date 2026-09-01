import { Module } from '@nestjs/common';

import { CallParticipantsController } from './call-participants.controller';
import { CallParticipantsService } from './providers/call-participants.service';

@Module({
  controllers: [CallParticipantsController],
  providers: [CallParticipantsService],
})
export class CallParticipantsModule {}
