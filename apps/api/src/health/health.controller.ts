import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';

import { ApiEndpoint } from '@/common/decorators/api-endpoint.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { PrismaHealthIndicator } from '@/health/indicators/prisma.health';
import { RedisHealthIndicator } from '@/health/indicators/redis.health';

@Controller('health')
@Public()
@SkipThrottle()
@ApiTags('Health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaHealthIndicator,
    private readonly redis: RedisHealthIndicator,
  ) {}

  @Get()
  @ResponseMessage('Service is alive')
  @ApiEndpoint('Check API liveness')
  liveness() {
    return { status: 'ok', uptime: process.uptime() };
  }

  @Get('ready')
  @HealthCheck()
  @ResponseMessage('Service is ready')
  @ApiEndpoint('Check database and Redis readiness')
  readiness() {
    return this.health.check([
      () => this.prisma.isHealthy('database'),
      () => this.redis.isHealthy('redis'),
    ]);
  }
}
