import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CallParticipantsService } from '@/call-participants/providers/call-participants.service';
import {
  ApiCreatedEndpoint,
  ApiEndpoint,
} from '@/common/decorators/api-endpoint.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import type { AuthenticatedUser } from '@/common/types/authenticated-user';

@Controller('call-participants')
@ApiTags('Call participants')
@ApiBearerAuth('access-token')
export class CallParticipantsController {
  constructor(private readonly participantsService: CallParticipantsService) {}

  @Get(':callId')
  @ApiEndpoint('List participants in a call')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('callId', ParseUUIDPipe) callId: string,
  ) {
    return this.participantsService.list(user.id, callId);
  }

  @Post(':callId/join')
  @ResponseMessage('Joined call')
  @ApiCreatedEndpoint('Join a call')
  join(
    @CurrentUser() user: AuthenticatedUser,
    @Param('callId', ParseUUIDPipe) callId: string,
  ) {
    return this.participantsService.join(user.id, callId);
  }

  @Patch(':callId/leave')
  @ResponseMessage('Left call')
  @ApiEndpoint('Leave a call')
  leave(
    @CurrentUser() user: AuthenticatedUser,
    @Param('callId', ParseUUIDPipe) callId: string,
  ) {
    return this.participantsService.leave(user.id, callId);
  }
}
