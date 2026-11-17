import { Controller, Post } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ApiCreatedEndpoint } from '@/common/decorators/api-endpoint.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/common/types/authenticated-user';

@Controller('realtime')
@ApiTags('Realtime')
@ApiBearerAuth('access-token')
export class RealtimeController {
  constructor(private readonly jwtService: JwtService) {}

  @Post('session')
  @ApiCreatedEndpoint('Issue a short-lived Socket.IO connection ticket')
  async session(@CurrentUser() user: AuthenticatedUser) {
    const token = await this.jwtService.signAsync(
      { sub: user.id, sid: user.sessionId, type: 'socket' },
      { expiresIn: 60 },
    );
    return { token };
  }
}
