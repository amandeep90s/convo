import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserModel } from '@repo/db';
import type { RegisterDto, TRegisterResponse } from '@repo/shared';

import { PrismaService } from '@/prisma.service';
import { CreateUserProvider } from '@/users/providers/create-user.provider';
import { FindOneUserByEmailProvider } from '@/users/providers/find-one-user-by-email.provider';
import { FindOneUserByUsernameProvider } from '@/users/providers/find-one-user-by-username.provider';

@Injectable()
export class UsersService {
  constructor(
    /**
     * Injecting FindOneUserByEmailProvider
     */
    private readonly findOneUserByEmailProvider: FindOneUserByEmailProvider,
    /**
     * Injecting FindOneUserByUsernameProvider
     */
    private readonly findOneUserByUsernameProvider: FindOneUserByUsernameProvider,
    /**
     * Injecting CreateUserProvider
     */
    private readonly createUserProvider: CreateUserProvider,

    private readonly prisma: PrismaService,
  ) {}

  public async findOneByEmail(email: string): Promise<UserModel | null> {
    return this.findOneUserByEmailProvider.findOneByEmail(email);
  }

  public async findOneByUsername(username: string): Promise<UserModel | null> {
    return this.findOneUserByUsernameProvider.findOneByUsername(username);
  }

  public async create(createUserDto: RegisterDto): Promise<TRegisterResponse> {
    return await this.createUserProvider.create(createUserDto);
  }

  async getMe(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        email: true,
        username: true,
        name: true,
        about: true,
        avatar_url: true,
        status: true,
        email_verified_at: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async updateMe(
    userId: string,
    data: {
      phone?: string;
      username?: string;
      name?: string;
      about?: string;
      avatar_url?: string;
    },
  ) {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data,
        select: {
          id: true,
          phone: true,
          email: true,
          username: true,
          name: true,
          about: true,
          avatar_url: true,
          status: true,
          updated_at: true,
        },
      });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException(
          'Email, phone, or username is already in use',
        );
      }
      throw error;
    }
  }

  async search(userId: string, query: string, page: number, limit: number) {
    const searchTerm = query.trim();
    if (searchTerm.length < 2) {
      throw new BadRequestException(
        'Search query must contain at least 2 characters',
      );
    }
    const blocked = await this.prisma.blockedUser.findMany({
      where: {
        OR: [{ user_id: userId }, { blocked_user_id: userId }],
      },
      select: { user_id: true, blocked_user_id: true },
    });
    const excludedIds = new Set(
      blocked.flatMap((entry) => [entry.user_id, entry.blocked_user_id]),
    );
    const where = {
      id: { not: userId, notIn: [...excludedIds] },
      status: 'active' as const,
      deleted_at: null,
      AND: [
        {
          OR: [
            { settings: { is: null } },
            { settings: { is: { profile_visibility: 'everyone' as const } } },
            {
              settings: { is: { profile_visibility: 'contacts' as const } },
              contacts: { some: { contact_user_id: userId } },
            },
          ],
        },
      ],
      OR: [
        { username: { contains: searchTerm, mode: 'insensitive' as const } },
        { name: { contains: searchTerm, mode: 'insensitive' as const } },
      ],
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          name: true,
          about: true,
          avatar_url: true,
        },
        orderBy: { username: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getProfile(userId: string, viewerId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, status: 'active', deleted_at: null },
      select: {
        id: true,
        username: true,
        name: true,
        about: true,
        avatar_url: true,
        settings: { select: { profile_visibility: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    const profile = {
      id: user.id,
      username: user.username,
      name: user.name,
      about: user.about,
      avatar_url: user.avatar_url,
    };
    if (userId === viewerId) return profile;

    const blocked = await this.prisma.blockedUser.findFirst({
      where: {
        OR: [
          { user_id: userId, blocked_user_id: viewerId },
          { user_id: viewerId, blocked_user_id: userId },
        ],
      },
      select: { user_id: true },
    });
    if (blocked) throw new NotFoundException('User not found');

    const visibility = user.settings?.profile_visibility ?? 'everyone';
    if (visibility === 'nobody') {
      throw new ForbiddenException('This profile is private');
    }
    if (visibility === 'contacts') {
      const contact = await this.prisma.contact.findUnique({
        where: {
          user_id_contact_user_id: {
            user_id: userId,
            contact_user_id: viewerId,
          },
        },
        select: { user_id: true },
      });
      if (!contact)
        throw new ForbiddenException(
          'This profile is visible to contacts only',
        );
    }

    return profile;
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
