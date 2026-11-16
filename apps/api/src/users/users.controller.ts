import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { PaginationDto, UpdateUserDto } from '@/common/dtos/api.dto';
import type { AuthenticatedUser } from '@/common/types/authenticated-user';
import { UsersService } from '@/users/providers/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ResponseMessage('Current user loaded')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getMe(user.id);
  }

  @Patch('me')
  @ResponseMessage('Profile updated')
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateUserDto,
  ) {
    return this.usersService.updateMe(user.id, body);
  }

  @Get('search')
  @ResponseMessage('Users found')
  search(
    @CurrentUser() user: AuthenticatedUser,
    @Query('q') query: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.usersService.search(
      user.id,
      query ?? '',
      pagination.page ?? 1,
      pagination.limit ?? 20,
    );
  }

  @Get(':userId')
  @ResponseMessage('User profile loaded')
  getProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.usersService.getProfile(userId, user.id);
  }
}
