import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { CallParticipantsService } from '@/call-participants/providers/call-participants.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import type { AuthenticatedUser } from '@/common/types/authenticated-user';

@Controller('call-participants')
export class CallParticipantsController {
  constructor(private readonly participantsService: CallParticipantsService) {}

  @Get(':callId')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('callId', ParseUUIDPipe) callId: string,
  ) {
    return this.participantsService.list(user.id, callId);
  }

  @Post(':callId/join')
  @ResponseMessage('Joined call')
  join(
    @CurrentUser() user: AuthenticatedUser,
    @Param('callId', ParseUUIDPipe) callId: string,
  ) {
    return this.participantsService.join(user.id, callId);
  }

  @Patch(':callId/leave')
  @ResponseMessage('Left call')
  leave(
    @CurrentUser() user: AuthenticatedUser,
    @Param('callId', ParseUUIDPipe) callId: string,
  ) {
    return this.participantsService.leave(user.id, callId);
  }
}
