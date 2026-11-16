import { Injectable } from '@nestjs/common';
import type { UserSettingsModel } from '@repo/db';
import type { UpdateUserSettingsDto } from '@repo/shared';

import { PrismaService } from '@/prisma.service';

@Injectable()
export class UserSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  get(userId: string): Promise<UserSettingsModel> {
    return this.prisma.userSettings.upsert({
      where: { user_id: userId },
      create: { user_id: userId },
      update: {},
    });
  }

  update(
    userId: string,
    data: UpdateUserSettingsDto,
  ): Promise<UserSettingsModel> {
    return this.prisma.userSettings.upsert({
      where: { user_id: userId },
      create: { user_id: userId, ...data },
      update: data,
    });
  }
}
