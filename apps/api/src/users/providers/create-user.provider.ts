import { Inject, Injectable, RequestTimeoutException } from '@nestjs/common';
import type { RegisterDto, TRegisterResponse } from '@repo/shared';

import { HashingProvider } from '@/auth/providers/hashing.provider';
import { PrismaService } from '@/prisma.service';

@Injectable()
export class CreateUserProvider {
  constructor(
    /**
     * Injecting HashingProvider to handle password hashing
     */
    @Inject(HashingProvider)
    private readonly hashingProvider: HashingProvider,

    /**
     * Injecting PrismaService to handle database operations
     */
    private readonly prisma: PrismaService,
  ) {}

  public async create(createUserDto: RegisterDto): Promise<TRegisterResponse> {
    try {
      const hashedPassword = await this.hashingProvider.hashPassword(
        createUserDto.password,
      );

      return await this.prisma.user.create({
        data: {
          name: createUserDto.name,
          username: createUserDto.username,
          email: createUserDto.email,
          password_hash: hashedPassword,
        },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          created_at: true,
        },
      });
    } catch (error) {
      throw new RequestTimeoutException(error, {
        description: 'Failed to create user',
      });
    }
  }
}
