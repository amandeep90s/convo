import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import {
  CreateUserDeviceDto,
  UpdateUserDeviceDto,
} from '@/common/dtos/api.dto';
import type { AuthenticatedUser } from '@/common/types/authenticated-user';
import { UserDevicesService } from '@/user-devices/providers/user-devices.service';

@Controller('user-devices')
export class UserDevicesController {
  constructor(private readonly userDevicesService: UserDevicesService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
  ): ReturnType<UserDevicesService['list']> {
    return this.userDevicesService.list(user.id);
  }

  @Post()
  @ResponseMessage('Device registered')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateUserDeviceDto,
  ): ReturnType<UserDevicesService['create']> {
    return this.userDevicesService.create(user.id, body);
  }

  @Patch(':deviceId')
  @ResponseMessage('Device updated')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('deviceId', ParseUUIDPipe) deviceId: string,
    @Body() body: UpdateUserDeviceDto,
  ) {
    return this.userDevicesService.update(user.id, deviceId, body);
  }

  @Delete(':deviceId')
  revoke(
    @CurrentUser() user: AuthenticatedUser,
    @Param('deviceId', ParseUUIDPipe) deviceId: string,
  ) {
    return this.userDevicesService.revoke(user.id, deviceId);
  }
}
