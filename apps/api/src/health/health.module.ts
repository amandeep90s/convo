import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { HealthController } from '@/health/health.controller';
import { PrismaHealthIndicator } from '@/health/indicators/prisma.health';
import { RedisHealthIndicator } from '@/health/indicators/redis.health';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [PrismaHealthIndicator, RedisHealthIndicator],
})
export class HealthModule {}
