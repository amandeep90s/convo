import { Injectable, NotFoundException } from '@nestjs/common';
import type { UserDeviceGetPayload } from '@repo/db';
import type { CreateUserDeviceDto, UpdateUserDeviceDto } from '@repo/shared';

import { PrismaService } from '@/prisma.service';

type UserDeviceListItem = UserDeviceGetPayload<{
  select: {
    id: true;
    user_id: true;
    device_type: true;
    device_name: true;
    last_seen_at: true;
    created_at: true;
    sessions: {
      select: {
        id: true;
        created_at: true;
        expires_at: true;
        ip_address: true;
      };
    };
  };
}>;

type UserDeviceItem = UserDeviceGetPayload<{
  select: {
    id: true;
    user_id: true;
    device_type: true;
    device_name: true;
    last_seen_at: true;
    created_at: true;
  };
}>;

@Injectable()
export class UserDevicesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string): Promise<UserDeviceListItem[]> {
    return this.prisma.userDevice.findMany({
      where: { user_id: userId, revoked_at: null },
      select: {
        id: true,
        user_id: true,
        device_type: true,
        device_name: true,
        last_seen_at: true,
        created_at: true,
        sessions: {
          where: { revoked_at: null, expires_at: { gt: new Date() } },
          select: {
            id: true,
            created_at: true,
            expires_at: true,
            ip_address: true,
          },
        },
      },
      orderBy: { last_seen_at: 'desc' },
    });
  }

  create(userId: string, data: CreateUserDeviceDto): Promise<UserDeviceItem> {
    return this.prisma.userDevice.create({
      data: { user_id: userId, ...data },
      select: {
        id: true,
        user_id: true,
        device_type: true,
        device_name: true,
        last_seen_at: true,
        created_at: true,
      },
    });
  }

  async update(userId: string, deviceId: string, data: UpdateUserDeviceDto) {
    const result = await this.prisma.userDevice.updateMany({
      where: { id: deviceId, user_id: userId, revoked_at: null },
      data,
    });
    if (!result.count) throw new NotFoundException('Device not found');
    return this.prisma.userDevice.findUniqueOrThrow({
      where: { id: deviceId },
      select: {
        id: true,
        user_id: true,
        device_type: true,
        device_name: true,
        last_seen_at: true,
        created_at: true,
      },
    });
  }

  async revoke(userId: string, deviceId: string) {
    const now = new Date();
    const result = await this.prisma.userDevice.updateMany({
      where: { id: deviceId, user_id: userId, revoked_at: null },
      data: { revoked_at: now },
    });
    if (!result.count) throw new NotFoundException('Device not found');
    await this.prisma.userSession.updateMany({
      where: { device_id: deviceId, user_id: userId, revoked_at: null },
      data: { revoked_at: now },
    });
    return { revoked: true };
  }
}
