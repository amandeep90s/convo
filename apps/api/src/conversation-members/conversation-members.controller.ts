import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import {
  ApiCreatedEndpoint,
  ApiEndpoint,
} from '@/common/decorators/api-endpoint.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import {
  CreateConversationMemberDto,
  PaginationDto,
  UpdateConversationMemberDto,
} from '@/common/dtos/api.dto';
import type { AuthenticatedUser } from '@/common/types/authenticated-user';
import { ConversationMembersService } from '@/conversation-members/providers/conversation-members.service';

@Controller('conversation-members')
@ApiTags('Conversation members')
@ApiBearerAuth('access-token')
export class ConversationMembersController {
  constructor(
    private readonly conversationMembersService: ConversationMembersService,
  ) {}

  @Get(':conversationId')
  @ApiEndpoint('List members of a conversation')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.conversationMembersService.list(
      user.id,
      conversationId,
      pagination.page ?? 1,
      pagination.limit ?? 20,
    );
  }

  @Post(':conversationId')
  @ResponseMessage('Member added')
  @ApiCreatedEndpoint('Add a member to a conversation')
  add(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Body() body: CreateConversationMemberDto,
  ) {
    return this.conversationMembersService.add(user.id, conversationId, body);
  }

  @Patch(':conversationId/:userId')
  @ResponseMessage('Member updated')
  @ApiEndpoint('Update a conversation member')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
    @Body() body: UpdateConversationMemberDto,
  ) {
    return this.conversationMembersService.update(
      user.id,
      conversationId,
      targetUserId,
      body,
    );
  }

  @Delete(':conversationId/:userId')
  @ApiEndpoint('Remove a member from a conversation')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
  ) {
    return this.conversationMembersService.remove(
      user.id,
      conversationId,
      targetUserId,
    );
  }
}
