import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { HealthController } from '@/health/health.controller';
import { PrismaHealthIndicator } from '@/health/indicators/prisma.health';
import { RedisHealthIndicator } from '@/health/indicators/redis.health';
import { PrismaService } from '@/prisma.service';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [PrismaService, PrismaHealthIndicator, RedisHealthIndicator],
})
export class HealthModule {}
