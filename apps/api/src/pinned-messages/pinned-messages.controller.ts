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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import {
  ApiCreatedEndpoint,
  ApiEndpoint,
} from '@/common/decorators/api-endpoint.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { CreatePinnedMessageDto } from '@/common/dtos/api.dto';
import type { AuthenticatedUser } from '@/common/types/authenticated-user';
import { PinnedMessagesService } from '@/pinned-messages/providers/pinned-messages.service';

@Controller('pinned-messages')
@ApiTags('Pinned messages')
@ApiBearerAuth('access-token')
export class PinnedMessagesController {
  constructor(private readonly pinnedMessagesService: PinnedMessagesService) {}

  @Get()
  @ApiEndpoint('List pinned messages in a conversation')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('conversationId', ParseUUIDPipe) conversationId: string,
  ) {
    return this.pinnedMessagesService.list(user.id, conversationId);
  }

  @Post()
  @ResponseMessage('Message pinned')
  @ApiCreatedEndpoint('Pin a message')
  pin(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreatePinnedMessageDto,
  ) {
    return this.pinnedMessagesService.pin(user.id, body.message_id);
  }

  @Delete(':messageId')
  @ApiEndpoint('Unpin a message')
  unpin(
    @CurrentUser() user: AuthenticatedUser,
    @Param('messageId', ParseUUIDPipe) messageId: string,
  ) {
    return this.pinnedMessagesService.unpin(user.id, messageId);
  }
}
