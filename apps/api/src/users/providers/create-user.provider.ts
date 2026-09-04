import { Inject, Injectable, RequestTimeoutException } from '@nestjs/common';
import { db } from '@repo/db';
import type { RegisterDto, TRegisterResponse } from '@repo/shared';

import { HashingProvider } from '@/auth/providers/hashing.provider';

@Injectable()
export class CreateUserProvider {
  constructor(
    /**
     * Injecting HashingProvider to handle password hashing
     */
    @Inject(HashingProvider)
    private readonly hashingProvider: HashingProvider,
  ) {}

  public async create(createUserDto: RegisterDto): Promise<TRegisterResponse> {
    try {
      const hashedPassword = await this.hashingProvider.hashPassword(
        createUserDto.password,
      );

      return await db.user.create({
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
