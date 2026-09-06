import { Injectable, RequestTimeoutException } from '@nestjs/common';
import { UserModel } from '@repo/db';

import { PrismaService } from '@/prisma.service';

@Injectable()
export class FindOneUserByUsernameProvider {
  constructor(
    /**
     * Injecting PrismaService to handle database operations
     */
    private readonly prisma: PrismaService,
  ) {}

  public async findOneByUsername(username: string): Promise<UserModel | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { username },
      });
    } catch (error) {
      throw new RequestTimeoutException(error, {
        description: 'Failed to find user by username',
      });
    }
  }
}
