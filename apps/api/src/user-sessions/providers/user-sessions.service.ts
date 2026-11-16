import { Injectable } from '@nestjs/common';

import { SessionProvider } from '@/auth/providers/session.provider';
import { PrismaService } from '@/prisma.service';

@Injectable()
export class UserSessionsService {
  constructor(
    private readonly sessions: SessionProvider,
    private readonly prisma: PrismaService,
  ) {}

  list(userId: string) {
    return this.sessions.list(userId);
  }

  revoke(userId: string, sessionId: string) {
    return this.sessions.revokeSession(userId, sessionId);
  }

  async revokeOthers(userId: string, currentSessionId: string) {
    const result = await this.prisma.userSession.updateMany({
      where: {
        user_id: userId,
        id: { not: currentSessionId },
        revoked_at: null,
      },
      data: { revoked_at: new Date() },
    });
    return { revokedCount: result.count };
  }
}
