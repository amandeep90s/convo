import { Module } from '@nestjs/common';

import { CallParticipantsController } from './call-participants.controller';
import { CallParticipantsProvider } from './providers/call-participants.provider';
import { CallParticipantsService } from './providers/call-participants.service';

@Module({
  controllers: [CallParticipantsController],
  providers: [CallParticipantsService, CallParticipantsProvider],
})
export class CallParticipantsModule {}
