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

import {
  ApiCreatedEndpoint,
  ApiEndpoint,
} from '@/common/decorators/api-endpoint.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { CreateMessageReactionDto } from '@/common/dtos/api.dto';
import type { AuthenticatedUser } from '@/common/types/authenticated-user';
import { MessageReactionsService } from '@/message-reactions/providers/message-reactions.service';

@Controller('message-reactions')
@ApiTags('Message reactions')
@ApiBearerAuth('access-token')
export class MessageReactionsController {
  constructor(private readonly reactionsService: MessageReactionsService) {}

  @Get(':messageId')
  @ApiEndpoint('List reactions on a message')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('messageId', ParseUUIDPipe) messageId: string,
  ) {
    return this.reactionsService.list(user.id, messageId);
  }

  @Post(':messageId')
  @ResponseMessage('Reaction added')
  @ApiCreatedEndpoint('Add a reaction to a message')
  add(
    @CurrentUser() user: AuthenticatedUser,
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @Body() body: CreateMessageReactionDto,
  ) {
    return this.reactionsService.add(user.id, messageId, body);
  }

  @Delete(':messageId')
  @ApiEndpoint('Remove the current user reaction')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('messageId', ParseUUIDPipe) messageId: string,
  ) {
    return this.reactionsService.remove(user.id, messageId);
  }
}
