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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import {
  ApiCreatedEndpoint,
  ApiEndpoint,
} from '@/common/decorators/api-endpoint.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { PaginationDto, UpdateConversationDto } from '@/common/dtos/api.dto';
import type { AuthenticatedUser } from '@/common/types/authenticated-user';
import { ConversationsService } from '@/conversations/providers/conversations.service';

@Controller('conversations')
@ApiTags('Conversations')
@ApiBearerAuth('access-token')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  @ApiEndpoint('List conversations with optional archive and star filters')
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
  @ApiEndpoint('Get a conversation')
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ) {
    return this.conversationsService.get(user.id, conversationId);
  }

  @Patch(':conversationId')
  @ResponseMessage('Conversation updated')
  @ApiEndpoint('Update a conversation')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Body() body: UpdateConversationDto,
  ) {
    return this.conversationsService.update(user.id, conversationId, body);
  }

  @Post(':conversationId/archive')
  @ResponseMessage('Conversation archived')
  @ApiCreatedEndpoint('Archive a conversation')
  archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ) {
    return this.conversationsService.archive(user.id, conversationId, true);
  }

  @Delete(':conversationId/archive')
  @ResponseMessage('Conversation unarchived')
  @ApiEndpoint('Unarchive a conversation')
  unarchive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ) {
    return this.conversationsService.archive(user.id, conversationId, false);
  }

  @Post(':conversationId/star')
  @ResponseMessage('Conversation starred')
  @ApiCreatedEndpoint('Star a conversation')
  star(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ) {
    return this.conversationsService.star(user.id, conversationId, true);
  }

  @Delete(':conversationId/star')
  @ResponseMessage('Conversation unstarred')
  @ApiEndpoint('Unstar a conversation')
  unstar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ) {
    return this.conversationsService.star(user.id, conversationId, false);
  }

  @Delete(':conversationId/everyone')
  @ResponseMessage('Chat deleted for everyone')
  @ApiEndpoint('Delete a private chat or admin-managed group for everyone')
  removeForEveryone(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ) {
    return this.conversationsService.removeForEveryone(user.id, conversationId);
  }

  @Delete(':conversationId')
  @ApiEndpoint('Leave a conversation')
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
