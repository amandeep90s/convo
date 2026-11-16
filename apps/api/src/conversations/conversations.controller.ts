import {
  BadRequestException,
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
import { PaginationDto, UpdateConversationDto } from '@/common/dtos/api.dto';
import type { AuthenticatedUser } from '@/common/types/authenticated-user';
import { ConversationsService } from '@/conversations/providers/conversations.service';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() pagination: PaginationDto,
    @Query('archived') archivedQuery?: string,
    @Query('starred') starredQuery?: string,
  ) {
    return this.conversationsService.list(
      user.id,
      pagination.page ?? 1,
      pagination.limit ?? 20,
      parseBoolean(archivedQuery),
      parseBoolean(starredQuery),
    );
  }

  @Get(':conversationId')
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ) {
    return this.conversationsService.get(user.id, conversationId);
  }

  @Patch(':conversationId')
  @ResponseMessage('Conversation updated')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Body() body: UpdateConversationDto,
  ) {
    return this.conversationsService.update(user.id, conversationId, body);
  }

  @Post(':conversationId/archive')
  @ResponseMessage('Conversation archived')
  archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ) {
    return this.conversationsService.archive(user.id, conversationId, true);
  }

  @Delete(':conversationId/archive')
  @ResponseMessage('Conversation unarchived')
  unarchive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ) {
    return this.conversationsService.archive(user.id, conversationId, false);
  }

  @Post(':conversationId/star')
  @ResponseMessage('Conversation starred')
  star(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ) {
    return this.conversationsService.star(user.id, conversationId, true);
  }

  @Delete(':conversationId/star')
  @ResponseMessage('Conversation unstarred')
  unstar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ) {
    return this.conversationsService.star(user.id, conversationId, false);
  }

  @Delete(':conversationId')
  leave(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ) {
    return this.conversationsService.leave(user.id, conversationId);
  }
}

function parseBoolean(value: string | undefined): boolean {
  if (value === undefined || value === 'false') return false;
  if (value === 'true') return true;
  throw new BadRequestException('Query values must be true or false');
}
