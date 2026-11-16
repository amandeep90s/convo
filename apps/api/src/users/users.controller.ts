import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ApiEndpoint } from '@/common/decorators/api-endpoint.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { PaginationDto, UpdateUserDto } from '@/common/dtos/api.dto';
import type { AuthenticatedUser } from '@/common/types/authenticated-user';
import { UsersService } from '@/users/providers/users.service';

@Controller('users')
@ApiTags('Users')
@ApiBearerAuth('access-token')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ResponseMessage('Current user loaded')
  @ApiEndpoint('Get the current user profile')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getMe(user.id);
  }

  @Patch('me')
  @ResponseMessage('Profile updated')
  @ApiEndpoint('Update the current user profile')
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateUserDto,
  ) {
    return this.usersService.updateMe(user.id, body);
  }

  @Get('search')
  @ResponseMessage('Users found')
  @ApiEndpoint('Search users')
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
  @ApiEndpoint('Get a user profile')
  getProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.usersService.getProfile(userId, user.id);
  }
}
