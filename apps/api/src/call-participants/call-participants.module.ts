import { Module } from '@nestjs/common';
import { CallParticipantsController } from './call-participants.controller';

@Module({
  controllers: [CallParticipantsController],
})
export class CallParticipantsModule {}
