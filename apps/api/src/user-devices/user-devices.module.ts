import { Module } from '@nestjs/common';

import { UserDevicesProvider } from './providers/user-devices.provider';
import { UserDevicesService } from './providers/user-devices.service';
import { UserDevicesController } from './user-devices.controller';

@Module({
  controllers: [UserDevicesController],
  providers: [UserDevicesService, UserDevicesProvider],
})
export class UserDevicesModule {}
