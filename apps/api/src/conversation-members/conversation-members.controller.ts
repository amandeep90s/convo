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
export class ConversationMembersController {
  constructor(
    private readonly conversationMembersService: ConversationMembersService,
  ) {}

  @Get(':conversationId')
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
  add(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Body() body: CreateConversationMemberDto,
  ) {
    return this.conversationMembersService.add(user.id, conversationId, body);
  }

  @Patch(':conversationId/:userId')
  @ResponseMessage('Member updated')
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
