import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ConversationAccessService } from '@/common/providers/conversation-access.service';
import { PrismaService } from '@/prisma.service';

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ConversationAccessService,
  ) {}

  async list(userId: string, page: number, limit: number) {
    const where = {
      user_id: userId,
      contact_user: {
        status: 'active' as const,
        deleted_at: null,
        blocked_users: { none: { blocked_user_id: userId } },
        blocked_by: { none: { user_id: userId } },
      },
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.contact.findMany({
        where,
        include: {
          contact_user: {
            select: {
              id: true,
              username: true,
              name: true,
              about: true,
              avatar_url: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.contact.count({ where }),
    ]);
    return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  async add(userId: string, contactUserId: string, nickname?: string) {
    if (userId === contactUserId)
      throw new ConflictException('Cannot add yourself as a contact');
    await this.access.assertNotBlocked(userId, contactUserId);
    const target = await this.prisma.user.findFirst({
      where: { id: contactUserId, status: 'active', deleted_at: null },
      select: { id: true },
    });
    if (!target) throw new NotFoundException('User not found');
    return this.prisma.contact.upsert({
      where: {
        user_id_contact_user_id: {
          user_id: userId,
          contact_user_id: contactUserId,
        },
      },
      create: { user_id: userId, contact_user_id: contactUserId, nickname },
      update: { nickname },
      include: {
        contact_user: {
          select: { id: true, username: true, name: true, avatar_url: true },
        },
      },
    });
  }

  async update(userId: string, contactUserId: string, nickname?: string) {
    const result = await this.prisma.contact.updateMany({
      where: { user_id: userId, contact_user_id: contactUserId },
      data: { nickname },
    });
    if (!result.count) throw new NotFoundException('Contact not found');
    return this.prisma.contact.findUniqueOrThrow({
      where: {
        user_id_contact_user_id: {
          user_id: userId,
          contact_user_id: contactUserId,
        },
      },
      include: {
        contact_user: {
          select: { id: true, username: true, name: true, avatar_url: true },
        },
      },
    });
  }

  async remove(userId: string, contactUserId: string) {
    const result = await this.prisma.contact.deleteMany({
      where: { user_id: userId, contact_user_id: contactUserId },
    });
    if (!result.count) throw new NotFoundException('Contact not found');
    return { removed: true };
  }
}
