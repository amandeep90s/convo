import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { CallsService } from '@/calls/providers/calls.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import {
  CreateCallDto,
  PaginationDto,
  UpdateCallDto,
} from '@/common/dtos/api.dto';
import type { AuthenticatedUser } from '@/common/types/authenticated-user';

@Controller('calls')
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('conversationId') conversationId: string | undefined,
    @Query() pagination: PaginationDto,
  ) {
    return this.callsService.list(
      user.id,
      conversationId,
      pagination.page ?? 1,
      pagination.limit ?? 20,
    );
  }

  @Post()
  @ResponseMessage('Call started')
  create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateCallDto) {
    return this.callsService.create(user.id, body);
  }

  @Get(':callId')
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('callId', ParseUUIDPipe) callId: string,
  ) {
    return this.callsService.get(user.id, callId);
  }

  @Patch(':callId')
  @ResponseMessage('Call updated')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('callId', ParseUUIDPipe) callId: string,
    @Body() body: UpdateCallDto,
  ) {
    return this.callsService.update(user.id, callId, body);
  }
}
