import { Module } from '@nestjs/common';
import { UserDevicesController } from './user-devices.controller';

@Module({
  controllers: [UserDevicesController],
})
export class UserDevicesModule {}
