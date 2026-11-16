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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import {
  ApiCreatedEndpoint,
  ApiEndpoint,
} from '@/common/decorators/api-endpoint.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import {
  CreateUserDeviceDto,
  UpdateUserDeviceDto,
} from '@/common/dtos/api.dto';
import type { AuthenticatedUser } from '@/common/types/authenticated-user';
import { UserDevicesService } from '@/user-devices/providers/user-devices.service';

@Controller('user-devices')
@ApiTags('User devices')
@ApiBearerAuth('access-token')
export class UserDevicesController {
  constructor(private readonly userDevicesService: UserDevicesService) {}

  @Get()
  @ApiEndpoint('List registered devices')
  list(
    @CurrentUser() user: AuthenticatedUser,
  ): ReturnType<UserDevicesService['list']> {
    return this.userDevicesService.list(user.id);
  }

  @Post()
  @ResponseMessage('Device registered')
  @ApiCreatedEndpoint('Register a device')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateUserDeviceDto,
  ): ReturnType<UserDevicesService['create']> {
    return this.userDevicesService.create(user.id, body);
  }

  @Patch(':deviceId')
  @ResponseMessage('Device updated')
  @ApiEndpoint('Update a registered device')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('deviceId', ParseUUIDPipe) deviceId: string,
    @Body() body: UpdateUserDeviceDto,
  ) {
    return this.userDevicesService.update(user.id, deviceId, body);
  }

  @Delete(':deviceId')
  @ApiEndpoint('Revoke a device')
  revoke(
    @CurrentUser() user: AuthenticatedUser,
    @Param('deviceId', ParseUUIDPipe) deviceId: string,
  ) {
    return this.userDevicesService.revoke(user.id, deviceId);
  }
}
