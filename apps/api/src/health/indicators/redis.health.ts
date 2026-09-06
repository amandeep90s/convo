import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthIndicatorService } from '@nestjs/terminus';
import { Redis } from 'ioredis';

const PING_TIMEOUT_MS = 2_000;

@Injectable()
export class RedisHealthIndicator implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    configService: ConfigService,
  ) {
    this.client = new Redis({
      host: configService.getOrThrow<string>('app.redisHost'),
      port: configService.getOrThrow<number>('app.redisPort'),
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      // Health probes must fail fast instead of queueing while Redis is down.
      enableOfflineQueue: false,
      // No background reconnect loop; each probe reconnects on demand.
      retryStrategy: () => null,
    });

    // Connection failures are reported by the probe itself; swallow them here
    // so ioredis does not emit unhandled 'error' events.
    this.client.on('error', () => undefined);
  }

  async isHealthy(key: string) {
    const indicator = this.healthIndicatorService.check(key);

    try {
      await this.withTimeout(this.connectAndPing());
      return indicator.up();
    } catch (error) {
      return indicator.down({
        message: error instanceof Error ? error.message : 'Redis unreachable',
      });
    }
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  private async connectAndPing() {
    const { status } = this.client;
    if (status === 'wait' || status === 'end' || status === 'close') {
      await this.client.connect();
    }
    await this.client.ping();
  }

  private withTimeout<T>(promise: Promise<T>) {
    return Promise.race([
      promise,
      new Promise<never>((_resolve, reject) =>
        setTimeout(
          () => reject(new Error('Redis ping timed out')),
          PING_TIMEOUT_MS,
        ).unref(),
      ),
    ]);
  }
}
