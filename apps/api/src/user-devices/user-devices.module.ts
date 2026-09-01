import { Module } from '@nestjs/common';

import { UserDevicesService } from './providers/user-devices.service';
import { UserDevicesController } from './user-devices.controller';

@Module({
  controllers: [UserDevicesController],
  providers: [UserDevicesService],
})
export class UserDevicesModule {}
