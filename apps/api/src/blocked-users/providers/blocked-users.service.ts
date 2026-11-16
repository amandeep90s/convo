import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { BlockedUserGetPayload } from '@repo/db';

import { PrismaService } from '@/prisma.service';

type BlockedUserListItem = BlockedUserGetPayload<{
  include: {
    blocked_user: {
      select: { id: true; username: true; name: true; avatar_url: true };
    };
  };
}>;

@Injectable()
export class BlockedUsersService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string): Promise<BlockedUserListItem[]> {
    return this.prisma.blockedUser.findMany({
      where: { user_id: userId },
      include: {
        blocked_user: {
          select: { id: true, username: true, name: true, avatar_url: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async add(userId: string, blockedUserId: string) {
    if (userId === blockedUserId)
      throw new ConflictException('Cannot block yourself');
    const target = await this.prisma.user.findFirst({
      where: { id: blockedUserId, deleted_at: null },
      select: { id: true },
    });
    if (!target) throw new NotFoundException('User not found');
    return this.prisma.blockedUser.upsert({
      where: {
        user_id_blocked_user_id: {
          user_id: userId,
          blocked_user_id: blockedUserId,
        },
      },
      create: { user_id: userId, blocked_user_id: blockedUserId },
      update: {},
    });
  }

  async remove(userId: string, blockedUserId: string) {
    const result = await this.prisma.blockedUser.deleteMany({
      where: { user_id: userId, blocked_user_id: blockedUserId },
    });
    if (!result.count) throw new NotFoundException('Blocked user not found');
    return { removed: true };
  }
}
