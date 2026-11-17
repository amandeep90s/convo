import { Global, Module } from '@nestjs/common';

import { AuthModule } from '@/auth/auth.module';
import { RealtimeController } from '@/realtime/realtime.controller';
import { RealtimeGateway } from '@/realtime/realtime.gateway';

@Global()
@Module({
  imports: [AuthModule],
  controllers: [RealtimeController],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
