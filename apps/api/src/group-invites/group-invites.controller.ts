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
import { Public } from '@/common/decorators/public.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { CreateGroupInviteDto } from '@/common/dtos/api.dto';
import { UpdateGroupInviteDto } from '@/common/dtos/api.dto';
import type { AuthenticatedUser } from '@/common/types/authenticated-user';
import { GroupInvitesService } from '@/group-invites/providers/group-invites.service';

@Controller('group-invites')
@ApiTags('Group invites')
export class GroupInvitesController {
  constructor(private readonly groupInvitesService: GroupInvitesService) {}

  @Post('conversations/:conversationId')
  @ApiBearerAuth('access-token')
  @ApiCreatedEndpoint('Create an invite for a group conversation')
  @ResponseMessage('Invite created')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Body() body: CreateGroupInviteDto,
  ) {
    return this.groupInvitesService.create(user.id, conversationId, body);
  }

  @Get('conversations/:conversationId')
  @ApiBearerAuth('access-token')
  @ApiEndpoint('List invites for a group conversation')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ) {
    return this.groupInvitesService.list(user.id, conversationId);
  }

  @Get('code/:code')
  @Public()
  @ApiEndpoint('Preview an invite using its code')
  preview(@Param('code') code: string) {
    return this.groupInvitesService.preview(code);
  }

  @Post('code/:code/join')
  @ResponseMessage('Joined group')
  @ApiBearerAuth('access-token')
  @ApiCreatedEndpoint('Join a group using an invite code')
  join(@CurrentUser() user: AuthenticatedUser, @Param('code') code: string) {
    return this.groupInvitesService.join(user.id, code);
  }

  @Patch(':inviteId')
  @ResponseMessage('Invite updated')
  @ApiBearerAuth('access-token')
  @ApiEndpoint('Update a group invite')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('inviteId', ParseUUIDPipe) inviteId: string,
    @Body() body: UpdateGroupInviteDto,
  ) {
    return this.groupInvitesService.update(user.id, inviteId, body);
  }

  @Delete(':inviteId')
  @ApiBearerAuth('access-token')
  @ApiEndpoint('Revoke a group invite')
  revoke(
    @CurrentUser() user: AuthenticatedUser,
    @Param('inviteId', ParseUUIDPipe) inviteId: string,
  ) {
    return this.groupInvitesService.revoke(user.id, inviteId);
  }
}
