import {
  Body,
  Controller,
  ForbiddenException,
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
import { CreatePrivateConversationDto } from '@/common/dtos/api.dto';
import type { AuthenticatedUser } from '@/common/types/authenticated-user';
import { PrivateConversationsService } from '@/private-conversations/providers/private-conversations.service';

@Controller('private-conversations')
@ApiTags('Private conversations')
@ApiBearerAuth('access-token')
export class PrivateConversationsController {
  constructor(
    private readonly privateConversationsService: PrivateConversationsService,
  ) {}

  @Post()
  @ResponseMessage('Private conversation created')
  @ApiCreatedEndpoint('Create or retrieve a private conversation')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreatePrivateConversationDto,
  ) {
    const otherUserId =
      body.user_a_id === user.id ? body.user_b_id : body.user_a_id;
    if (body.user_a_id !== user.id && body.user_b_id !== user.id) {
      throw new ForbiddenException(
        'You can only create a conversation involving your account',
      );
    }
    return this.privateConversationsService.create(user.id, otherUserId);
  }

  @Get(':conversationId')
  @ApiEndpoint('Get private conversation details')
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ) {
    return this.privateConversationsService.get(user.id, conversationId);
  }
}
