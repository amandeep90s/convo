import { Body, Controller, Get, Patch } from '@nestjs/common';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { UpdateUserSettingsDto } from '@/common/dtos/api.dto';
import type { AuthenticatedUser } from '@/common/types/authenticated-user';
import { UserSettingsService } from '@/user-settings/providers/user-settings.service';

@Controller('user-settings')
export class UserSettingsController {
  constructor(private readonly userSettingsService: UserSettingsService) {}

  @Get()
  get(
    @CurrentUser() user: AuthenticatedUser,
  ): ReturnType<UserSettingsService['get']> {
    return this.userSettingsService.get(user.id);
  }

  @Patch()
  @ResponseMessage('Settings updated')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateUserSettingsDto,
  ): ReturnType<UserSettingsService['update']> {
    return this.userSettingsService.update(user.id, body);
  }
}
