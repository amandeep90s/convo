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
  CreateMessageDto,
  SearchMessagesDto,
  UpdateMessageDto,
} from '@/common/dtos/api.dto';
import type { AuthenticatedUser } from '@/common/types/authenticated-user';
import { MessagesService } from '@/messages/providers/messages.service';

@Controller('messages')
@ApiTags('Messages')
@ApiBearerAuth('access-token')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('search')
  @ApiEndpoint('Search messages and filter matching results')
  search(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SearchMessagesDto,
  ) {
    return this.messagesService.search(user.id, query);
  }

  @Get()
  @ApiEndpoint('List messages in a conversation')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('conversationId', ParseUUIDPipe) conversationId: string,
    @Query('cursor', new ParseUUIDPipe({ optional: true }))
    cursor: string | undefined,
    @Query('limit') limit: string | undefined,
  ) {
    return this.messagesService.list(
      user.id,
      conversationId,
      cursor,
      Number(limit ?? 30),
    );
  }

  @Post()
  @ResponseMessage('Message sent')
  @ApiCreatedEndpoint('Send a message')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateMessageDto,
  ) {
    return this.messagesService.create(user.id, body);
  }

  @Get(':messageId')
  @ApiEndpoint('Get a message')
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('messageId', ParseUUIDPipe) messageId: string,
  ) {
    return this.messagesService.get(user.id, messageId);
  }

  @Patch(':messageId')
  @ResponseMessage('Message updated')
  @ApiEndpoint('Edit a message')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @Body() body: UpdateMessageDto,
  ) {
    return this.messagesService.update(user.id, messageId, body);
  }

  @Delete(':messageId')
  @ApiEndpoint('Delete a message')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('messageId', ParseUUIDPipe) messageId: string,
  ) {
    return this.messagesService.remove(user.id, messageId);
  }
}
