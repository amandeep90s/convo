import { ConflictException, Inject, Injectable } from '@nestjs/common';
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
     * Injecting PrismaService for database access
     */
    private readonly prisma: PrismaService,
  ) {}

  public async create(createUserDto: RegisterDto): Promise<TRegisterResponse> {
    const hashedPassword = await this.hashingProvider.hashPassword(
      createUserDto.password,
    );

    try {
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
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException(
          'A user with this email or username already exists',
        );
      }
      throw error;
    }
  }
}

function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}
