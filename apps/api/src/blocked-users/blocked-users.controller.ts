import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { BlockedUsersService } from '@/blocked-users/providers/blocked-users.service';
import {
  ApiCreatedEndpoint,
  ApiEndpoint,
} from '@/common/decorators/api-endpoint.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { CreateBlockedUserDto } from '@/common/dtos/api.dto';
import type { AuthenticatedUser } from '@/common/types/authenticated-user';

@Controller('blocked-users')
@ApiTags('Blocked users')
@ApiBearerAuth('access-token')
export class BlockedUsersController {
  constructor(private readonly blockedUsersService: BlockedUsersService) {}

  @Get()
  @ApiEndpoint('List blocked users')
  list(
    @CurrentUser() user: AuthenticatedUser,
  ): ReturnType<BlockedUsersService['list']> {
    return this.blockedUsersService.list(user.id);
  }

  @Post()
  @ResponseMessage('User blocked')
  @ApiCreatedEndpoint('Block a user')
  add(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateBlockedUserDto,
  ) {
    return this.blockedUsersService.add(user.id, body.blocked_user_id);
  }

  @Delete(':userId')
  @ApiEndpoint('Unblock a user')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) blockedUserId: string,
  ) {
    return this.blockedUsersService.remove(user.id, blockedUserId);
  }
}
