import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { CreatePinnedMessageDto } from '@/common/dtos/api.dto';
import type { AuthenticatedUser } from '@/common/types/authenticated-user';
import { PinnedMessagesService } from '@/pinned-messages/providers/pinned-messages.service';

@Controller('pinned-messages')
export class PinnedMessagesController {
  constructor(private readonly pinnedMessagesService: PinnedMessagesService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('conversationId', ParseUUIDPipe) conversationId: string,
  ) {
    return this.pinnedMessagesService.list(user.id, conversationId);
  }

  @Post()
  @ResponseMessage('Message pinned')
  pin(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreatePinnedMessageDto,
  ) {
    return this.pinnedMessagesService.pin(user.id, body.message_id);
  }

  @Delete(':messageId')
  unpin(
    @CurrentUser() user: AuthenticatedUser,
    @Param('messageId', ParseUUIDPipe) messageId: string,
  ) {
    return this.pinnedMessagesService.unpin(user.id, messageId);
  }
}
