import { Controller, Delete, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ApiEndpoint } from '@/common/decorators/api-endpoint.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import type { AuthenticatedUser } from '@/common/types/authenticated-user';
import { UserSessionsService } from '@/user-sessions/providers/user-sessions.service';

@Controller('user-sessions')
@ApiTags('User sessions')
@ApiBearerAuth('access-token')
export class UserSessionsController {
  constructor(private readonly userSessionsService: UserSessionsService) {}

  @Get()
  @ApiEndpoint('List active sessions')
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.userSessionsService.list(user.id);
  }

  @Delete('others')
  @ResponseMessage('Other sessions revoked')
  @ApiEndpoint('Revoke all other sessions')
  revokeOthers(@CurrentUser() user: AuthenticatedUser) {
    return this.userSessionsService.revokeOthers(user.id, user.sessionId);
  }

  @Delete(':sessionId')
  @ApiEndpoint('Revoke a session')
  revoke(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return this.userSessionsService.revoke(user.id, sessionId);
  }
}
