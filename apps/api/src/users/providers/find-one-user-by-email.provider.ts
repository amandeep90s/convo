import { Injectable, RequestTimeoutException } from '@nestjs/common';
import { UserModel } from '@repo/db';

import { PrismaService } from '@/prisma.service';

@Injectable()
export class FindOneUserByEmailProvider {
  constructor(
    /**
     * Injecting PrismaService to handle database operations
     */
    private readonly prisma: PrismaService,
  ) {}

  public async findOneByEmail(email: string): Promise<UserModel | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      throw new RequestTimeoutException(error, {
        description: 'Failed to find user by email',
      });
    }
  }
}
