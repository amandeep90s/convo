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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CallsService } from '@/calls/providers/calls.service';
import {
  ApiCreatedEndpoint,
  ApiEndpoint,
} from '@/common/decorators/api-endpoint.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import {
  CreateCallDto,
  PaginationDto,
  UpdateCallDto,
} from '@/common/dtos/api.dto';
import type { AuthenticatedUser } from '@/common/types/authenticated-user';

@Controller('calls')
@ApiTags('Calls')
@ApiBearerAuth('access-token')
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Get()
  @ApiEndpoint('List calls')
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
  @ApiCreatedEndpoint('Start a call')
  create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateCallDto) {
    return this.callsService.create(user.id, body);
  }

  @Get(':callId')
  @ApiEndpoint('Get call details')
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('callId', ParseUUIDPipe) callId: string,
  ) {
    return this.callsService.get(user.id, callId);
  }

  @Patch(':callId')
  @ResponseMessage('Call updated')
  @ApiEndpoint('Update a call')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('callId', ParseUUIDPipe) callId: string,
    @Body() body: UpdateCallDto,
  ) {
    return this.callsService.update(user.id, callId, body);
  }
}
