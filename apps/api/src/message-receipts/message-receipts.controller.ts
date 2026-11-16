import {
  Controller,
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
import type { AuthenticatedUser } from '@/common/types/authenticated-user';
import { MessageReceiptsService } from '@/message-receipts/providers/message-receipts.service';

@Controller('message-receipts')
@ApiTags('Message receipts')
@ApiBearerAuth('access-token')
export class MessageReceiptsController {
  constructor(private readonly receiptsService: MessageReceiptsService) {}

  @Get()
  @ApiEndpoint('List message delivery and read receipts')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('conversationId', ParseUUIDPipe) conversationId: string,
  ) {
    return this.receiptsService.list(user.id, conversationId);
  }

  @Post(':messageId/delivered')
  @ResponseMessage('Message marked as delivered')
  @ApiCreatedEndpoint('Mark a message as delivered')
  delivered(
    @CurrentUser() user: AuthenticatedUser,
    @Param('messageId', ParseUUIDPipe) messageId: string,
  ) {
    return this.receiptsService.delivered(user.id, messageId);
  }

  @Patch(':messageId/read')
  @ResponseMessage('Message marked as read')
  @ApiEndpoint('Mark a message as read')
  read(
    @CurrentUser() user: AuthenticatedUser,
    @Param('messageId', ParseUUIDPipe) messageId: string,
  ) {
    return this.receiptsService.read(user.id, messageId);
  }
}
