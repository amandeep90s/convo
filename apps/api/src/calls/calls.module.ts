import { Module } from '@nestjs/common';

import { CallsController } from './calls.controller';
import { CallsProvider } from './providers/calls.provider';
import { CallsService } from './providers/calls.service';

@Module({
  controllers: [CallsController],
  providers: [CallsService, CallsProvider],
})
export class CallsModule {}
